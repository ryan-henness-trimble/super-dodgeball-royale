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

const GRP_WORLD = 1;
const GRP_PLAYER = 0;

const PLAYER_RADIUS = 20;
const BALL_RADIUS = 15;

const WORLD_CATEGORY = 0x00000001;
const PLAYER_CATEGORY = 0x000000002;

const WORLD_MASK = PLAYER_CATEGORY;
const PLAYER_MASK = WORLD_CATEGORY;

const PLAYER_VELOCITY = 4.0;
const SHIELD_ANGULAR_VELOCITY = 0.1;
const INITIAL_HP = 3;
const IFRAME_DURATION_ON_HIT = 2000;

const BALL_BASE_SPEED = 3.0;
const BALL_BOOSTED_SPEED = 9.0;

const BODY_TYPE = Object.freeze({
    WALL: 0,
    PLAYER_HITBOX: 1,
    PLAYER_SHIELD: 2,
    BALL: 3
});

// TODO maybe want to use large simulation units, then scale down for rendering
// e.g. player radius = 40, ball radius = 30, render scale 0.5

class Simulation {
    
    constructor() {
        this.mapProvider = new MapProvider();

        this.engine = null;

        this.playersById = new Map();
        this.ballsById = new Map();
        this.idToBodyType = new Map();

        this.playersHit = [];
        this.playersToEliminate = [];
        this.iframePlayers = [];
        this.stepEvents = [];

        this.playerEliminationOrder = [];

        this.roundEnded = false;
    }

    reset(mapName, numberOfPlayers) {
        const gameMap = this.mapProvider.getMap(mapName);

        this.ballSpawnManager = new BallSpawnManager().initializeWithBallSpawnPoint(gameMap.ballSpawn);

        this.roundEnded = false;

        this.playersById.clear();
        this.ballsById.clear();
        this.idToBodyType.clear();

        this.playersHit = [];
        this.playersToEliminate = [];
        this.iframePlayers = [];
        this.stepEvents = [gameevents.createNewBallSpawn(this.ballSpawnManager.getNextSpawnInformation())];
        this.playerEliminationOrder = [];

        const wallBodies = gameMap.walls.map(w => makeWall(w.x, w.y, w.w, w.h, w.angle));
        wallBodies.forEach(w => this.idToBodyType.set(w.id, BODY_TYPE.WALL));

        const players = gameMap.playerSpawns.slice(0, numberOfPlayers).map(p => makePlayer(p.x, p.y));
        players.forEach(p => {
            this.playersById.set(p.id, p);
            this.idToBodyType.set(p.hitboxId, BODY_TYPE.PLAYER_HITBOX);
            this.idToBodyType.set(p.shieldId, BODY_TYPE.PLAYER_SHIELD);
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
            }),
            events: this.stepEvents
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
            if (c.type === gameevents.NEW_BALL_SPAWN) {
                return;
            }

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

        if (this.ballSpawnManager.shouldSpawnBall()) {
            this.spawnBall(this.engine.world);
            this.ballSpawnManager.ballWasSpawned();
            this.stepEvents.push(gameevents.createNewBallSpawn(this.ballSpawnManager.getNextSpawnInformation()));
        }

        this.ballSpawnManager.step(timestepMs);

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
                iframeDuration: p.iframeDuration,
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
        evt.pairs.forEach(p => {
            const collisionInfo = this.identifyCollidedBodies(p.bodyA, p.bodyB);

            if (collisionInfo.singleBallCollision) {
                const otherType = this.idToBodyType.get(collisionInfo.other.id);

                switch (otherType) {
                    case BODY_TYPE.WALL:
                        this.setBallSpeed(collisionInfo.ball, BALL_BASE_SPEED);
                        break;
                    case BODY_TYPE.PLAYER_HITBOX:
                        const playerId = collisionInfo.other.parent.id;
                        this.playersHit.push(this.playersById.get(playerId));
                        break;
                    case BODY_TYPE.PLAYER_SHIELD:
                        const player = this.playersById.get(collisionInfo.other.parent.id);

                        // Subtract Pi/2 since shield is not in line with angle 0
                        this.setBodyVelocity(collisionInfo.ball, player.body.angle - Math.PI/2, BALL_BOOSTED_SPEED);
                        break;
                }
            }
        });
    }

    identifyCollidedBodies(bodyA, bodyB) {
        const bodies = [bodyA, bodyB];

        const balls = bodies.filter(b => this.idToBodyType.get(b.id) === BODY_TYPE.BALL);

        if (balls.length === 1) {
            return {
                singleBallCollision: true,
                ball: balls[0],
                other: balls[0].id === bodyA.id ? bodyB : bodyA
            };
        } else {
            return {
                singleBallCollision: false
            };
        }
    }

    setBodyVelocity(body, angle, speed) {
        Body.setVelocity(body, polarToCartesian(angle, speed));
    }

    setBallSpeed(ballBody, speed) {
        const currentSpeed = Math.max(ballBody.speed, 0.1);
        
        const speedMultiplier = speed / currentSpeed;
        const velocity = {
            x: ballBody.velocity.x * speedMultiplier,
            y: ballBody.velocity.y * speedMultiplier
        };

        Body.setVelocity(ballBody, velocity);
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

            this.stepEvents.push(gameevents.createPlayerEliminated(player.id));
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

    spawnBall(world) {
        const nextBallSpawn = this.ballSpawnManager.getNextSpawnInformation();
        const body = makeBall(nextBallSpawn.spawn.x, nextBallSpawn.spawn.y);
        Body.setVelocity(body, { x: nextBallSpawn.xVel, y: nextBallSpawn.yVel });
        const ball = {
            id: body.id,
            body: body
        };

        this.idToBodyType.set(ball.id, BODY_TYPE.BALL);
        this.ballsById.set(ball.id, ball);
    
        Composite.add(world, body);
    }

    allArePlayersEliminated() {
        return this.playerEliminationOrder.length === this.playersById.size;
    }
}

class BallSpawnManager {

    constructor() {
        this.INTERVAL_TIMING_MS = 5000;

        // First ball spawn should always be quick
        this.nextSpawnTimingMs = 2000;
        this.nextSpawnInformation = null;
        this.ballSpawnPoints = []
    }

    initializeWithBallSpawnPoint(ballSpawnPoint)
    {
        this.#addBallSpawnPoint(ballSpawnPoint);
        this.nextSpawnInformation = this.#generateNewSpawnInformation();
        return this;
    }

    // Get next spawn information plus spawn timing
    getNextSpawnInformation()
    {
        return Object.assign({ nextSpawnTimingMs: this.nextSpawnTimingMs }, this.nextSpawnInformation )
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
        this.nextSpawnInformation = this.#generateNewSpawnInformation();
    }

    #addBallSpawnPoint(spawnPoint)
    {
        if (!this.ballSpawnPoints.includes(bsp => bsp.x === spawnPoint.x && bsp.y === spawnPoint.y))
        {
            this.ballSpawnPoints.push(spawnPoint);
        }
    }

    #generateNewSpawnInformation()
    {
        const angle = 2 * Math.PI * Math.random();
        const xVel = BALL_BASE_SPEED * Math.cos(angle);
        const yVel = BALL_BASE_SPEED * Math.sin(angle);
        const spawn = this.ballSpawnPoints[Math.floor(Math.random()*(this.ballSpawnPoints.length - 1))]
        return {
            spawn: spawn,
            xVel: xVel,
            yVel: yVel,
            angle: angle
        }
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
        shieldId: shield.id,
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

function polarToCartesian(angle, magnitude) {
    return {
        x: magnitude * Math.cos(angle),
        y: magnitude * Math.sin(angle)
    };
}

function toRadians(degrees) {
    return degrees * Math.PI / 180;
}

exports.Simulation = Simulation;
