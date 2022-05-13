const Matter = require('matter-js');

const Engine = Matter.Engine;
const Bodies = Matter.Bodies;
const Composite = Matter.Composite;

// 1280x720
// arena: 700x700 centered
// walls 100 thickness, 700 length
// arena offset from window: 290,10

// +290 +10
// 350, -50, 700, 100

const PLAYER_RADIUS = 20;
const BALL_RADIUS = 10;

// TODO probably want to use large simulation units, then scale down for rendering
// e.g. player radius = 40, ball radius = 30, render scale 0.5

class Simulation {
    
    constructor() {
        this.engine = null;
    }

    // return where the walls are [ (xy,wh) ]
    reset() {
        const bounds = [ // x, y, w, h
            [...toWindowCoordinates(350, -50), 900, 100], // top
            [...toWindowCoordinates(350, 750), 900, 100], // bottom
            [...toWindowCoordinates(-50, 350), 100, 900], // left
            [...toWindowCoordinates(750, 350), 100, 900] // right
        ];

        const playerPositions = [
            [...toWindowCoordinates(100, 100), PLAYER_RADIUS],
            [...toWindowCoordinates(600, 600), PLAYER_RADIUS]
        ];

        // potential params above

        // this.engine = Engine.create();
        // engine.world.gravity.y = 0;

        // output below
        
        return {
            walls: bounds.map(([x, y, w, h]) => {
                return {
                    x, y, w, h
                };
            }),
            players: playerPositions.map(([x, y, r]) => {
                return {
                    x, y, r
                };
            })
        };
    }

    step(commands, timestepMs) {

    }

    getState() {

    }
}

function toWindowCoordinates(x, y) {
    return [x + 290, y + 10];
}

function makeWall(x, y, w, h) {
    let wall = Bodies.rectangle(x, y, w, h, { isStatic: true });
    wall.friction = 0;
    wall.frictionStatic = 0;
    wall.frictionAir = 0;
    wall.restitution = 1;
    wall.inertia = Infinity;

    return wall;
}

function makeCircle(x, y, r) {
    let circle = Bodies.circle(x, y, r);
    // circle.mass = 0;
    circle.friction = 0;
    circle.frictionStatic = 0;
    circle.frictionAir = 0;
    circle.restitution = 1;
    circle.inertia = Infinity;

    return circle;
}

exports.Simulation = Simulation;
