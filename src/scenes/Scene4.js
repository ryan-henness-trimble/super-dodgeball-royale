// const { io } = window;

// 1: single-player remote pong against wall
// physics on server (with simulated latency + packet loss)
// client as dumb terminal first

const GAME_SETUP_ID = 'multiplayer prototype: setup';
const GAME_ACTIVE_ID = 'multiplayer prototype: active';

class GameSetup extends Phaser.Scene {
    constructor() {
        super(GAME_SETUP_ID);
        this.playerInfo = null;
    }

    preload() {
    }

    create() {
        this.socket = io("https://super-dodgeball-royale-server.herokuapp.com/");

        this.socket.on('setup', (p) => {
            console.log('received setup');

            this.playerInfo = {
                id: p.player.id,
                x: p.player.xPos,
                y: p.player.yPos,
                radius: p.player.radius
            };

            this.socket.emit('game control', { status: 'setup done' });
        });

        this.socket.on('gamestate', (p) => {
            console.log('received waiting');
            if (this.playerInfo) {
                console.log('start next scene');
                this.socket.off('gamestate');
                this.socket.emit('game control', { status: 'ready' });
                this.scene.start(GAME_ACTIVE_ID, {
                    socket: this.socket,
                    player: this.playerInfo
                });
            }
        });

        this.add.text(10, 70, 'Waiting');
    }

    update() { }
}

class GameActive extends Phaser.Scene {
    constructor() {
        super(GAME_ACTIVE_ID);
    }

    preload() { }

    create({ socket, player }) {
        console.log('started active');

        this.currentState = {
            player: {
                id: player.id,
                x: player.x,
                y: player.y
            }
        };
        this.nextState = this.currentState;

        this.socket = socket;

        this.socket.on('gamestate', this.receiveState.bind(this));

        this.add.text(10, 70, 'Multiplayer Active');

        // this.player = Phaser.Physics.Matter.Matter.Bodies.rectangle(player.x, player.y, player.radius, player.radius);
        // Phaser.Physics.Matter.Matter.Composite.add(this.matter.world, this.player);

        // this.add.existing(this.player);

        this.player = this.add.circle(player.x, player.y, player.radius, 0xffffff);

        this.cursorKeys = this.input.keyboard.createCursorKeys();
    }

    receiveState(state) {
        this.nextState = state;
    }

    update() {
        const state = this.currentState;

        // this.matter.body.setPosition(this.player, { x: state.x, y: state.y });
        this.player.setPosition(state.player.x, state.player.y);

        this.currentState = this.nextState;

        this.socket.emit('client input', this.getInputInfo());
    }

    getInputInfo() {
        let inputInfo = {
            u: false,
            d: false,
            l: false,
            r: false
        };

        if (this.cursorKeys.up.isDown) {
            inputInfo.u = true;
        }
        if (this.cursorKeys.down.isDown) {
            inputInfo.d = true;
        }
        if (this.cursorKeys.left.isDown) {
            inputInfo.l = true;
        }
        if (this.cursorKeys.right.isDown) {
            inputInfo.r = true;
        }

        return inputInfo;
    }
}

/*
{
    player: {
        x:
        y:
    }
}
*/
