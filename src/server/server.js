const { Server } = require('socket.io');
const Matter = require('matter-js');

const SERVER_PORT = process.env.PORT | 8090;
const GAME_LOOP_MS = 1000 / 60;

const SIMULATED_LAG_MS = 200;
const SIMULATED_PACKET_LOSS = 0.8;

const Engine = Matter.Engine;
const Bodies = Matter.Bodies;
const Composite = Matter.Composite;

class MultiplayerGame {
    constructor(socket) {
        this.GAME_WIDTH = 800;
        this.GAME_HEIGHT = 600;
        this.PLAYER_RADIUS = 20;
        this.playerId = 34;

        this.playerSocket = socket;

        this.playerSocket.on('game control', this.handleGameControl.bind(this));

        this.REVERSE_RIGHT = 600;
        this.REVERSE_LEFT = 200;
    }

    setup() {
        this.player = Bodies.circle(this.GAME_WIDTH / 2, this.GAME_HEIGHT / 2, this.PLAYER_RADIUS);

        this.player.friction = 0;
        this.player.frictionStatic = 0;
        this.player.frictionAir = 0;
        this.player.restitution = 1;
        this.player.inertia = Infinity;

        this.engine = Engine.create();
        this.engine.gravity.y = 0;
        Composite.add(this.engine.world, this.player);

        const setupInfo = {
            player: {
                id: this.playerId,
                xPos: this.player.position.x,
                yPos: this.player.position.y,
                radius: this.PLAYER_RADIUS
            }
        };

        this.playerSocket.emit('setup', setupInfo);

        this.currentInput = {
            u: false,
            d: false,
            l: false,
            r: false
        };
        this.nextInput = this.currentInput;
    }

    stop() {
        clearInterval(this.gameLoop);
    }

    handleGameControl(message) {
        if (message.status === 'setup done') {
            console.log('starting waiting');
            this.gameLoop = setInterval(this.waitingLoop.bind(this), GAME_LOOP_MS);
        } else if (message.status === 'ready') {
            console.log('starting real game loop');
            clearInterval(this.gameLoop);
            Matter.Body.setVelocity(this.player, { x: 3, y: 0 });
            this.playerSocket.on('client input', this.receiveInput.bind(this));
            this.gameLoop = setInterval(this.update.bind(this), GAME_LOOP_MS);
        }
    }

    receiveInput(input) {
        if (Math.random() > SIMULATED_PACKET_LOSS) {
            setTimeout(() => this.nextInput = input, SIMULATED_LAG_MS / 2);
        }
    }

    waitingLoop() {
        console.log('waiting');
        const state = {
            player: {
                id: this.playerId,
                x: this.player.x,
                y: this.player.y
            }
        };
        this.playerSocket.emit('gamestate', state);
    }

    update() {
        // console.log('running');
        const input = this.currentInput;

        if (input.u) {
            updateVelocity(this.player, { y: -3 });
        } else if (input.d) {
            updateVelocity(this.player, { y: 3 });
        } else {
            updateVelocity(this.player, { y: 0 });
        }

        if (this.player.position.x > this.REVERSE_RIGHT) {
            updateVelocity(this.player, { x: -3 });
        } else if (this.player.position.x < this.REVERSE_LEFT) {
            updateVelocity(this.player, { x: 3 });
        }

        Engine.update(this.engine, GAME_LOOP_MS);

        const state = {
            player: {
                id: this.playerId,
                x: this.player.position.x,
                y: this.player.position.y
            }
        }
        this.sendState(state);

        this.currentInput = this.nextInput;
    }

    sendState(state) {
        if (Math.random() > SIMULATED_PACKET_LOSS) {
            setTimeout(() => this.playerSocket.emit('gamestate', state), SIMULATED_LAG_MS / 2);
        }
    }
}

function updateVelocity(body, nextVelocity) {
    const v = Object.assign({}, body.velocity, nextVelocity);
    Matter.Body.setVelocity(body, v);
}

// client connects
// server: setup -> playerInfo
// client: game control -> status = 'setup done'
// server: gamestate -> playerInfo (looping)
// client: game control -> status = 'ready'
// server: gamestate -> playerInfo (looping)

const io = new Server({
    cors: {
        origin: ['*'],
        methods: ["GET", "POST"]
    }
});

let currentGame = null;

io.on('connection', (socket) => {
    console.log('client connected');

    currentGame = new MultiplayerGame(socket);

    currentGame.setup();

    socket.on('disconnect', () => {
        console.log('client disconnected');
        currentGame.stop();
        currentGame = null;
    });
});

console.log(`WS Listening on Port ${SERVER_PORT}`);
io.listen(SERVER_PORT);
