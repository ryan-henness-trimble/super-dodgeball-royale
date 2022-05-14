const Matter = require('matter-js');

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

// 3 is a good speed to keep the balls at permanently
// slow enough to be able to process, but fast enough to be challenging when there are a lot of them
const BALL_SPEED = 3;

// TODO maybe want to use large simulation units, then scale down for rendering
// e.g. player radius = 40, ball radius = 30, render scale 0.5

class Simulation {
    
    constructor() {
        this.engine = null;
        this.playersById = new Map();
        this.ballsById = new Map();

        this.hitboxIdsToPlayerIds = new Map();

        this.PLAYER_VELOCITY = 4;
        this.ANGULAR_VELOCITY = 0.075;
    }

    reset() {
        const bounds = [ // x, y, w, h
            [...toWindowCoordinates(350, -50), 900, 100], // top
            [...toWindowCoordinates(350, 750), 900, 100], // bottom
            [...toWindowCoordinates(-50, 350), 100, 900], // left
            [...toWindowCoordinates(750, 350), 100, 900] // right
        ];

        const playerPositions = [
            [...toWindowCoordinates(100, 100)],
            [...toWindowCoordinates(600, 600)]
        ];

        // potential params above

        this.playersById.clear();
        this.ballsById.clear();

        const wallBodies = bounds.map(b => makeWall(...b));

        const players = playerPositions.map(p => makePlayer(...p));
        players.forEach(p => {
            this.playersById.set(p.id, p);
            this.hitboxIdsToPlayerIds.set(p.hitboxId, p.id);
        });

        this.engine = Engine.create();
        this.engine.world.gravity.y = 0;

        Composite.add(this.engine.world, wallBodies);
        Composite.add(this.engine.world, players.map(p => p.body));

        Events.on(this.engine, 'collisionEnd', this.handleCollisions.bind(this));

        // output below
        
        return {
            walls: bounds.map(([x, y, w, h]) => {
                return {
                    x, y, w, h
                };
            }),
            players: players.map(p => {
                return {
                    id: p.id,
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
        //     playerId: 0,
        //     up, down, left, right, cw, ccw
        // }

        commands.forEach(c => {
            if (c.hasOwnProperty('spawnBall')) {
                const body = makeBall(...toWindowCoordinates(350, 350));
                Body.setVelocity(body, { x: 0, y: -BALL_SPEED });
                const ball = {
                    id: body.id,
                    body: body
                };

                this.ballsById.set(ball.id, ball);

                Composite.add(this.engine.world, body);

                return;
            }

            const player = this.playersById.get(c.id);

            const velocity = {
                x: getMovementDirection(c.left, c.right) * this.PLAYER_VELOCITY,
                y: getMovementDirection(c.up, c.down) * this.PLAYER_VELOCITY
            };

            const rotation = getMovementDirection(c.ccw, c.cw) * this.ANGULAR_VELOCITY;

            Body.setVelocity(player.body, velocity);
            Body.setAngularVelocity(player.body, rotation);
        });

        Engine.update(this.engine, timestepMs);
    }

    getState() {
        const players = Array.from(this.playersById.entries()).map(([id, p]) => {
            return {
                id: id,
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

        return {
            players: players,
            balls: balls
        };
    }

    handleCollisions(evt) {
        // if ball is colliding, always keep velocity up
        // if player hitbox and ball, subtract health

        evt.pairs.forEach(p => {
            this.ensureBallKeepsMoving(p.bodyA);
            this.ensureBallKeepsMoving(p.bodyB);

            if (!this.ballsById.has(p.bodyA.Id) || !this.ballsById.has(p.bodyB.Id)) {
                // console.log(p);
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
}

class IdGenerator {

    constructor() {
        this.currentValue = 0;
    }

    generate() {
        return this.currentValue++;
    }

    reset() {
        this.currentValue = 0;
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
            group: GRP_PLAYER,
            category: PLAYER_CATEGORY,
            mask: PLAYER_MASK
        }
    });

    console.log(player);

    return {
        id: player.id,
        hitboxId: hitbox.id,
        body: player
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

function toWindowCoordinates(x, y) {
    return [x + 290, y + 10];
}

function makeWall(x, y, w, h) {
    let wall = Bodies.rectangle(x, y, w, h, { isStatic: true });

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

exports.Simulation = Simulation;
