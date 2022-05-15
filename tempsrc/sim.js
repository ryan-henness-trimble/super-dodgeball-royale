const { Matter } = window;

// server:
// given: all commands for the current tick, amount of time to simulate
// apply commands to all player objects (set velocity)
// apply step to engine world
// return relevant properties for each entity

// client:
// given: server state
// render the server state to the screen
// record the relevant commands from user input
// send command to server

function makeCircle(x, y) {
    let circle = Bodies.circle(x, y, 20);
    // circle.mass = 0;
    circle.friction = 0;
    circle.frictionStatic = 0;
    circle.frictionAir = 0;
    circle.restitution = 1;
    circle.inertia = Infinity;

    return circle;
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

// module aliases
var Engine = Matter.Engine,
    Render = Matter.Render,
    Runner = Matter.Runner,
    Bodies = Matter.Bodies,
    Composite = Matter.Composite;

Matter.Resolver._restingThresh = 0.001;

// create an engine
var engine = Engine.create();
engine.world.gravity.y = 0;

// create a renderer
var render = Render.create({
    element: document.body,
    engine: engine
});

let circle1 = makeCircle(400, 300);
Matter.Body.setVelocity(circle1, Matter.Vector.create(0, 4));

let circle2 = makeCircle(400, 500);
Matter.Body.setVelocity(circle2, Matter.Vector.create(0, -4));

// create two boxes and a ground
var boxA = Bodies.rectangle(400, 200, 80, 80);
var boxB = Bodies.rectangle(450, 50, 80, 80);

// 800 x 600
let floor = makeWall(400, 610, 810, 60);
let ceiling = makeWall(400, -10, 810, 60);
let left = makeWall(-10, 300, 60, 580);
let right = makeWall(810, 300, 60, 580);

// add all of the bodies to the world
Composite.add(engine.world, [circle1, circle2, floor, ceiling, left, right]);

let count = 2

setInterval(() => {
    if (count < 10) {
        let c = makeCircle(100, 100);
        Matter.Body.setVelocity(c, Matter.Vector.create(1, 5));

        Composite.add(engine.world, c);
        count++;
    }
    console.log(Matter.Composite.allBodies(engine.world));
}, 500);

// run the renderer
Render.run(render);

// create runner
var runner = Runner.create();

// run the engine
Runner.run(runner, engine);
