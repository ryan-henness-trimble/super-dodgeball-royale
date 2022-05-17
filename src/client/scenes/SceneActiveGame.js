class SceneActiveGame extends Phaser.Scene {

    constructor() {
        super('active-game');
    }

    preload() { }

    create({ network, initialState }) {
        console.log('creating active game');
        console.log(initialState);

        this.network = network;

        this.add.text(20, 20, 'Active Game');

        this.renderInitialGameState(initialState);

        this.registerInputKeys();

        this.lastSimUpdate = null;

        this.network.subscribeToActiveGame(() => {}, (newState) => {
            this.lastSimUpdate = newState;
        });

        this.updateFn = this.waitForSimUpdates.bind(this);

        this.network.sendGameCommand(SDRGame.Messaging.GameCommands.createClientReady());
    }

    update() {
        this.updateFn();
    }

    waitForSimUpdates() {
        if (this.lastSimUpdate) {
            this.updateFn = this.runGame.bind(this);
        }
    }

    runGame() {
        this.renderState(this.lastSimUpdate);

        // read inputs
        const inputs = {
            up: this.cursorKeys.up.isDown,
            down: this.cursorKeys.down.isDown,
            left: this.cursorKeys.left.isDown,
            right: this.cursorKeys.right.isDown,
            cw: this.keyD.isDown,
            ccw: this.keyA.isDown
        };
        this.network.sendSimCommand(inputs);
    }

    renderInitialGameState(arena) {
        arena.walls.forEach(wall => this.add.rectangle(wall.x, wall.y, wall.w, wall.h, 0x000000));

        this.playersById = new Map();

        arena.players.forEach((p, i) => {
            const shield = this.add.rectangle(0, -15, 25, 30, 0x48B0FF);
            const body = this.add.circle(0, 0, p.r, p.color);
            const label = this.add.text(0, 0, p.name, { fill: '#ffffff' });

            const playerGraphic = this.add.container(p.x, p.y, [shield, body, label]);

            const player = {
                id: p.id,
                name: p.name,
                color: p.color,
                graphic: playerGraphic,
                hitboxGraphic: body,
                hpLabel: this.add.text(20, 100 + i*30, this.formatHPLabelString(p.name, p.hp))
            };

            this.playersById.set(p.id, player);
        });

        this.add.circle(30, 60, 15, 0xdd2222);

        this.ballsById = new Map();

        this.eventHistory = {
            events: ['Events:'],
            label: this.add.text(1120, 50, 'Events:')
        };
    }

    registerInputKeys() {
        this.cursorKeys = this.input.keyboard.createCursorKeys();

        this.keyA = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
        this.keyD = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);
    }

    renderState(state) {
        state.players.forEach(p => {
            const player = this.playersById.get(p.id);
            player.graphic.setPosition(p.x, p.y);
            player.graphic.setRotation(p.angle);

            player.hpLabel.setText(this.formatHPLabelString(player.name, p.hp));

            if (p.isEliminated) {
                player.hitboxGraphic.setFillStyle(0x000000);
            } else if (p.hasIFrames) {
                player.hitboxGraphic.setFillStyle(0xbb0000);
            } else {
                player.hitboxGraphic.setFillStyle(player.color);
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

        const nextEvents = this.eventHistory.events.concat(state.events.map(e => this.formatEventAsString(e)));
        this.eventHistory.events = nextEvents;
        this.eventHistory.label.setText(nextEvents.join('\n'));
    }

    formatEventAsString(evt) {
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

    formatHPLabelString(playerName, hp) {
        return `${playerName} HP: ${hp}`;
    }
}
