class TestingScene extends Phaser.Scene {

    constructor() {
        super('testing-scene');
        this.sim = new SDRGame.Simulation();

        this.TIMESTEP = 1000 / 30;
    }

    preload() {
        
    }

    create() {
        this.add.text(20, 20, 'Testing Scene');

        const arena = this.sim.reset('basic', 10);

        arena.walls.forEach(wall => this.add.rectangle(wall.x, wall.y, wall.w, wall.h, 0x000000));

        this.playersById = new Map();

        arena.players.forEach((p, i) => {
            const body = this.add.circle(0, 0, p.r, 0xbbbbbb);
            const shield = this.add.rectangle(0, -15, 25, 30, 0x48B0FF);
            const label = this.add.text(0, 0, p.id, { fill: '#000000' });

            const playerGraphic = this.add.container(p.x, p.y, [body, shield, label]);

            const player = {
                id: p.id,
                graphic: playerGraphic,
                hitboxGraphic: body,
                hpLabel: this.add.text(20, 100 + i*30, formatHPLabelString(p.id, p.hp))
            };

            this.playersById.set(p.id, player);
        });

        this.playerIds = arena.players.map(p => p.id);

        this.add.circle(30, 60, 15, 0xdd2222);

        this.ballsById = new Map();

        this.eventHistory = {
            events: ['Events:'],
            label: this.add.text(1120, 50, 'Events:')
        };

        this.keyA = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
        this.keyD = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);
        this.keyW = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W);
        this.keyS = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S);
        this.keyQ = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.Q);
        this.keyE = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E);

        this.keyJ = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.J);
        this.keyL = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.L);
        this.keyI = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.I);
        this.keyK = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.K);
        this.keyU = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.U);
        this.keyO = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.O);

        // key5 = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.FIVE);
        this.keySpace = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
        this.spaceDown = false;
    }

    update() {
        // Gather inputs
        const command1 = {
            id: this.playerIds[0],
            up: this.keyW.isDown,
            down: this.keyS.isDown,
            left: this.keyA.isDown,
            right: this.keyD.isDown,
            cw: this.keyE.isDown,
            ccw: this.keyQ.isDown
        };

        const command2 = {
            id: this.playerIds[1],
            up: this.keyI.isDown,
            down: this.keyK.isDown,
            left: this.keyJ.isDown,
            right: this.keyL.isDown,
            cw: this.keyO.isDown,
            ccw: this.keyU.isDown,
        };

        const commands = [command1, command2];

        if (this.keySpace.isDown) {
            this.spaceDown = true;
        }
        if (this.spaceDown && this.keySpace.isUp) {
            commands.push({
                spawnBall: true
            });
            this.spaceDown = false;
        }

        // Update
        this.sim.step(commands, this.TIMESTEP);

        // Render
        const state = this.sim.getState();

        state.players.forEach(p => {
            const player = this.playersById.get(p.id);
            player.graphic.setPosition(p.x, p.y);
            player.graphic.setRotation(p.angle);

            player.hpLabel.setText(formatHPLabelString(p.id, p.hp));

            if (p.isEliminated) {
                player.hitboxGraphic.setFillStyle(0x000000);
            } else if (p.hasIFrames) {
                player.hitboxGraphic.setFillStyle(0xbb0000);
            } else {
                player.hitboxGraphic.setFillStyle(0xbbbbbb)
            }
        });

        state.balls.forEach(b => {
            if (this.ballsById.has(b.id)) {
                const ball = this.ballsById.get(b.id);
                ball.setPosition(b.x, b.y);
            } else {
                const newBall = this.add.circle(b.x, b.y, 15, 0xdd2222);
                this.ballsById.set(b.id, newBall);
            }
        });

        const nextEvents = this.eventHistory.events.concat(state.events.map(e => formatEventAsString(e)));
        this.eventHistory.events = nextEvents;
        this.eventHistory.label.setText(nextEvents.join('\n'));
    }
}

function formatEventAsString(evt) {
    switch (evt.type) {
        case SDRGame.gameevents.ROUND_OVER:
            return 'round over';
        case SDRGame.gameevents.PLAYER_HIT:
            return `hit: ${evt.playerId}`;
        case SDRGame.gameevents.PLAYER_ELIMINATED:
            return `out: ${evt.playerId}`;
        default:
            return 'unknown event';
    }
}

function formatHPLabelString(playerId, hp) {
    return `${playerId} HP: ${hp}`;
}
