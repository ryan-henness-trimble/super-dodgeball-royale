const Matter = require('matter-js');
const { MapProvider } = require('../shared/MapProvider');
const { gameevents } = require('../shared/gameevents');

const Engine = Matter.Engine;
const Events = Matter.Events;
const Bodies = Matter.Bodies;
const Body = Matter.Body;
const Composite = Matter.Composite;

// 1280x720
// arena: 700x700 centered
// walls 100 thickness, 700 length
// arena offset from window: 290,10

// +290 +10
// 350, -50, 700, 100

const GRP_WORLD = 1;
const GRP_PLAYER = 0;

const PLAYER_RADIUS = 20;
const BALL_RADIUS = 15;

const WORLD_CATEGORY = 0x00000001;
const PLAYER_CATEGORY = 0x000000002;

const WORLD_MASK = PLAYER_CATEGORY;
const PLAYER_MASK = WORLD_CATEGORY;

const PLAYER_VELOCITY = 2.5;
const SHIELD_ANGULAR_VELOCITY = 0.075;
const INITIAL_HP = 3;
const IFRAME_DURATION_ON_HIT = 2000;

// 3 is a good speed to keep the balls at permanently
// slow enough to be able to process, but fast enough to be challenging when there are a lot of them
const BALL_SPEED = 3.25;

// TODO maybe want to use large simulation units, then scale down for rendering
// e.g. player radius = 40, ball radius = 30, render scale 0.5

class Simulation {
    
    constructor() {
        this.mapProvider = new MapProvider();

        this.ballSpawnPoint = null;

        this.engine = null;
        this.playersById = new Map();
        this.ballsById = new Map();

        this.hitboxIdsToPlayerIds = new Map();

        this.playersHit = [];
        this.playersToEliminate = [];
        this.iframePlayers = [];
        this.stepEvents = [];

        this.playerEliminationOrder = [];

        this.roundEnded = false;
    }

    reset(mapName, numberOfPlayers) {
        const gameMap = this.mapProvider.getMap(mapName);

        this.ballSpawnTiming = new BallSpawnTiming();

        this.ballSpawnPoint = gameMap.ballSpawn;

        this.roundEnded = false;

        this.playersById.clear();
        this.ballsById.clear();
        this.playersHit = [];
        this.playersToEliminate = [];
        this.iframePlayers = [];
        this.stepEvents = [];

        this.playerEliminationOrder = [];

        const wallBodies = gameMap.walls.map(w => makeWall(w.x, w.y, w.w, w.h, w.angle));

        const players = gameMap.playerSpawns.slice(0, numberOfPlayers).map(p => makePlayer(p.x, p.y));
        players.forEach(p => {
            this.playersById.set(p.id, p);
            this.hitboxIdsToPlayerIds.set(p.hitboxId, p.id);
        });

        this.engine = Engine.create();
        this.engine.gravity.y = 0;

        Composite.add(this.engine.world, wallBodies);
        Composite.add(this.engine.world, players.map(p => p.body));

        Events.on(this.engine, 'collisionEnd', this.handleCollisions.bind(this));

        // output below
        
        return {
            walls: gameMap.walls, // { x, y, w, h, angle }
            players: players.map(p => {
                return {
                    id: p.id,
                    hp: p.hp,
                    x: p.body.position.x,
                    y: p.body.position.y,
                    angle: p.body.angle,
                    r: PLAYER_RADIUS
                };
            })
        };
    }

    step(commands, timestepMs) {
        // {
        //     id: 0,
        //     up, down, left, right, cw, ccw
        // }

        this.stepEvents = [];

        if (this.roundEnded) {
            return;
        }

        commands.forEach(c => {
            const player = this.playersById.get(c.id);

            if (player.isEliminated) {
                return;
            }

            const velocity = {
                x: getMovementDirection(c.left, c.right) * PLAYER_VELOCITY,
                y: getMovementDirection(c.up, c.down) * PLAYER_VELOCITY
            };

            const rotation = getMovementDirection(c.ccw, c.cw) * SHIELD_ANGULAR_VELOCITY;

            Body.setVelocity(player.body, velocity);
            Body.setAngularVelocity(player.body, rotation);
        });

        if (this.ballSpawnTiming.shouldSpawnBall()) {
            this.spawnBall(this.ballSpawnPoint, this.engine.world);
            this.ballSpawnTiming.ballWasSpawned();
        }

        this.ballSpawnTiming.step(timestepMs);

        Engine.update(this.engine, timestepMs);

        this.updateIFrames(timestepMs);
        this.resolveHits();
        this.resolveEliminations();
        this.checkRoundOver();
    }

    getState() {
        const players = Array.from(this.playersById.entries()).map(([id, p]) => {
            return {
                id: id,
                hp: p.hp,
                hasIFrames: p.iframeDuration > 0,
                isEliminated: p.isEliminated,
                x: p.body.position.x,
                y: p.body.position.y,
                angle: p.body.angle
            };
        });
        const balls = Array.from(this.ballsById.entries()).map(([id, ball]) => {
            return {
                id,
                x: ball.body.position.x,
                y: ball.body.position.y
            };
        });

        // possible types of events:
        // ball spawning, ball spawned, player hit, player eliminated, round over
        return {
            players: players,
            balls: balls,
            events: this.stepEvents
        };
    }

    handleCollisions(evt) {
        // if ball is colliding, always keep velocity up
        // if player hitbox and ball, subtract health

        evt.pairs.forEach(p => {
            this.ensureBallKeepsMoving(p.bodyA);
            this.ensureBallKeepsMoving(p.bodyB);

            const hitCheck = this.playerWasHitByBall(p.bodyA, p.bodyB)
            if (hitCheck.hit) {
                const playerId = this.hitboxIdsToPlayerIds.get(hitCheck.playerHitbox.id);
                this.playersHit.push(this.playersById.get(playerId));
            }
        });
    }

    ensureBallKeepsMoving(ballBody) {
        if (!this.ballsById.has(ballBody.id)) {
            return;
        }

        if(ballBody.speed != 0) {
            let speedMultiplier = BALL_SPEED / ballBody.speed;
            const velocity = {
                x: ballBody.velocity.x * speedMultiplier,
                y: ballBody.velocity.y * speedMultiplier
            };

            Body.setVelocity(ballBody, velocity);
        }
    }

    playerWasHitByBall(bodyA, bodyB) {
        const bodies = [bodyA, bodyB];

        const balls = bodies.filter(b => this.ballsById.has(b.id));
        const players = bodies.filter(b => this.hitboxIdsToPlayerIds.has(b.id));

        if (balls.length === 1 && players.length === 1) {
            return {
                hit: true,
                ball: balls[0],
                playerHitbox: players[0]
            };
        } else {
            return {
                hit: false
            };
        }
    }

    resolveHits() {
        this.playersHit.filter(p => p.iframeDuration === 0).forEach(player => {
            player.hp -= 1;

            if (player.hp <= 0) {
                this.playersToEliminate.push(player);
            } else {
                player.iframeDuration = IFRAME_DURATION_ON_HIT;
                this.iframePlayers.push(player);
                this.stepEvents.push(gameevents.createPlayerHit(player.id));
            }
        });

        this.playersHit = [];
    }

    resolveEliminations() {
        this.playersToEliminate.forEach(player => {
            Composite.remove(this.engine.world, player.body);
            player.isEliminated = true;

            this.playerEliminationOrder.push(player);
        });

        this.playersToEliminate = [];
    }

    updateIFrames(timestepMs) {
        this.iframePlayers.forEach(player => {
            player.iframeDuration = Math.max(player.iframeDuration - timestepMs, 0);
        });

        this.iframePlayers = this.iframePlayers.filter(p => p.iframeDuration > 0);
    }

    checkRoundOver() {
        if (this.playerEliminationOrder.length >= this.playersById.size - 1) {
            this.stepEvents.push(gameevents.createRoundOver());
            this.roundEnded = true;
        }
    }

    gameIsOver() {
        return this.roundEnded;
    }

    getPlayerScoreboardOrder() {
        const scoreBoardOrder = this.playerEliminationOrder.map(p => p.id).reverse();

        if (this.allArePlayersEliminated()) {
            return scoreBoardOrder;
        } else {
            const winningPlayer = Array.from(this.playersById.entries())
                .map(([_, p]) => p)
                .find(p => !p.isEliminated);
            
            return [winningPlayer.id, ...scoreBoardOrder];
        }
    }

    spawnBall(spawnPoint, world) {
        const angle = 2 * Math.PI * Math.random();
        const xVel = BALL_SPEED * Math.cos(angle);
        const yVel = BALL_SPEED * Math.sin(angle);

        const body = makeBall(spawnPoint.x, spawnPoint.y);
        Body.setVelocity(body, { x: xVel, y: yVel });
        const ball = {
            id: body.id,
            body: body
        };
    
        this.ballsById.set(ball.id, ball);
    
        Composite.add(world, body);
    }

    allArePlayersEliminated() {
        return this.playerEliminationOrder.length === this.playersById.size;
    }
}

class BallSpawnTiming {

    constructor() {
        this.INTERVAL_TIMING_MS = 2000;
        this.nextSpawnTimingMs = this.INTERVAL_TIMING_MS;
    }

    timeUntilNextSpawn() {
        return this.nextSpawnTimingMs;
    }

    step(timeMs) {
        this.nextSpawnTimingMs -= timeMs;
    }

    shouldSpawnBall() {
        return this.nextSpawnTimingMs <= 0;
    }

    ballWasSpawned() {
        this.nextSpawnTimingMs = this.INTERVAL_TIMING_MS;
    }
}

function makePlayer(x, y) {
    const options = {
        mass: 200,
        friction: 0,
        frictionStatic: 0,
        frictionAir: Infinity,
        restitution: 1,
        inertia: Infinity
    };

    const hitbox = Bodies.circle(x, y, PLAYER_RADIUS, options);
    const shield = Bodies.rectangle(x, y-15, 25, 30, options);

    const player = Body.create({
        parts: [hitbox, shield],
        collisionFilter: {
            group: GRP_WORLD,
            category: PLAYER_CATEGORY,
            mask: PLAYER_MASK
        }
    });

    return {
        id: player.id,
        hitboxId: hitbox.id,
        iframeDuration: 0,
        body: player,
        hp: INITIAL_HP,
        isEliminated: false
    };
}

function makeBall(x, y) {
    const options = {
        mass: 100,
        friction: 0,
        frictionStatic: 0,
        frictionAir: 0,
        restitution: 1,
        inertia: Infinity,
        collisionFilter: {
            group: GRP_WORLD,
            category: WORLD_CATEGORY,
            mask: WORLD_MASK
        }
    };

    return Bodies.circle(x, y, BALL_RADIUS, options);
}

function getMovementDirection(moveTowardsNegative, moveTowardsPositive) {
    if (moveTowardsNegative === moveTowardsPositive) {
        return 0;
    } else if (moveTowardsNegative) {
        return -1;
    } else if (moveTowardsPositive) {
        return 1
    }

    return 0;
}

function makeWall(x, y, w, h, angle) {
    let wall = Bodies.rectangle(x, y, w, h, {
        angle: toRadians(angle),
        isStatic: true
    });

    wall.collisionFilter = {
        group: GRP_WORLD,
        category: WORLD_CATEGORY,
        mask: WORLD_MASK
    };

    wall.friction = 0;
    wall.frictionStatic = 0;
    wall.frictionAir = 0;
    wall.restitution = 1;
    wall.inertia = Infinity;

    return wall;
}

function makeCircle(x, y, r) {
    let circle = Bodies.circle(x, y, r);

    circle.collisionFilter = {
        group: GRP_PLAYER,
        category: PLAYER_CATEGORY,
        mask: PLAYER_MASK
    };

    // circle.mass = 0;
    circle.friction = 0;
    circle.frictionStatic = 0;
    circle.frictionAir = 0;
    circle.restitution = 1;
    circle.inertia = Infinity;

    return circle;
}

function toRadians(degrees) {
    return degrees * Math.PI / 180;
}

exports.Simulation = Simulation;
