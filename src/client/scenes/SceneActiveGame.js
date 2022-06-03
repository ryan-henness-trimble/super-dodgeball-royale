class SceneActiveGame extends Phaser.Scene {

    constructor() {
        super('active-game');
    }

    preload() {
        // Load in animation
        this.load.spritesheet('elimination', 'assets/img/elimination.png', {
            frameWidth: 40, frameHeight: 40
        });

        this.load.image('heart', 'assets/img/pixel-heart-small.png');
        
        this.load.audio('elimination_audio', ['assets/audio/elimination.wav']);
        this.load.audio('game-start', ['assets/audio/gamestart.wav']);
    }

    create({ network, initialState }) {
        this.network = network;
        this.lastSimUpdate = null;
        this.nextBallSpawnIndicator = null;
        this.nextSpawnInformation = null;
        this.events = [];

        this.registerInputKeys();
        this.renderInitialGameState(initialState);

        this.network.lobby.subscribeToGameUpdates(this.handleGameUpdate.bind(this));
        this.network.lobby.subscribeToSimUpdates((simState) => {
            this.lastSimUpdate = simState;
            this.events = simState.events;
        });

        this.updateFn = this.waitForSimUpdates.bind(this);

        this.network.lobby.sendGameCommand(SDRGame.Messaging.GameCommands.createClientReady());

        this.anims.create({
            key: 'elim_anim',
            frames: this.anims.generateFrameNumbers('elimination'),
            frameRate: 8,
            repeat: 3
        });

        this.eliminationAudio = this.sound.add('elimination_audio', { loop: false, volume: 0.2 });
        this.startGameAudio = this.sound.add('game-start', { loop: false, volume: 0.2 });
    }

    update() {
        this.updateFn();
    }

    waitForSimUpdates() {
        if (this.lastSimUpdate) {
            this.infoLabel.setAlpha(0);
            this.startGameAudio.play();
            this.updateFn = this.runGame.bind(this);
        }
    }

    runGame() {
        this.renderState(this.lastSimUpdate);

        // read inputs
        const inputs = {
            up: this.keyUp.isDown,
            down: this.keyDown.isDown,
            left: this.keyLeft.isDown,
            right: this.keyRight.isDown,
            cw: this.keyD.isDown,
            ccw: this.keyA.isDown
        };
        this.network.lobby.sendSimCommand(inputs);
    }

    renderInitialGameState(arena) {
        const bg = this.add.image(0, 0, 'background');
        bg.setOrigin(0, 0);
        bg.displayWidth = SDRGame.GameConstants.WINDOW_WIDTH;
        bg.displayHeight = SDRGame.GameConstants.WINDOW_HEIGHT;

        const infoX = SDRGame.GameConstants.WINDOW_WIDTH / 2;
        const infoY = SDRGame.GameConstants.WINDOW_HEIGHT / 2;

        this.infoLabel = this.add.text(infoX, infoY - 200, 'Waiting for players');
        this.infoLabel.setOrigin(0.5, 0.5);

        arena.walls.forEach(wall => {
            const wallGraphic = this.add.rectangle(wall.x, wall.y, wall.w, wall.h, 0x675270);
            wallGraphic.setAngle(wall.angle);
        });

        this.playersById = new Map();

        arena.players.forEach((p, i) => {
            const shield = this.add.rectangle(0, -15, 25, 30, p.shieldColor);
            const body = this.add.circle(0, 0, p.r, p.playerColor);

            const playerIcon = this.add.container(0, 0, [shield, body]);

            const label = this.add.text(0, 30, p.name, { fill: '#ffffff' });
            label.setOrigin(0.5, 0.5);

            const heartGraphics = this.createHeartImages(p.hp);
            this.renderLives(p.hp, heartGraphics);
            const heartContainer = this.add.container(0, 0, heartGraphics);

            const fullPlayer = this.add.container(p.x, p.y, [playerIcon, label, heartContainer]);

            const player = {
                id: p.id,
                name: p.name,
                playerColor: p.playerColor,
                body: playerIcon,
                hitboxGraphic: body,
                graphic: fullPlayer,
                hearts: heartGraphics
            };

            this.playersById.set(p.id, player);
        });

        this.ballsById = new Map();
        this.events = arena.events;
        this.#handleStateEvents()
    }

    createHeartImages(hp) {
        return Array.from(Array(hp).keys()).map(i => this.add.image(0, 0, 'heart'));
    }

    renderLives(numLives, heartIcons) {
        const heartOffset = 10;
        const startingOffset = -heartOffset * (numLives - 1) / 2;

        heartIcons.slice(0, numLives).forEach((h, i) => {
            h.setPosition(startingOffset + heartOffset * i, 0);
        });
        heartIcons.slice(numLives).forEach(h => h.setAlpha(0));
    }

    registerInputKeys() {
        this.keyLeft = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.LEFT, false);
        this.keyRight = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.RIGHT, false);
        this.keyUp = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.UP, false);
        this.keyDown = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.DOWN, false);
        this.keyA = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A, false);
        this.keyD = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D, false);
    }

    renderState(state) {
        this.#handleStateEvents();

        this.#updateNextBallSpawnIndicator();

        state.players.forEach(p => {
            const player = this.playersById.get(p.id);
            this.setPlayerPosition(player, p.x, p.y);
            this.setPlayerAngle(player, p.angle);

            this.renderLives(p.hp, player.hearts);

            if (p.isEliminated) {
                player.graphic.setAlpha(0);
            } else if (p.hasIFrames) {
                const toggle = Math.floor(p.iframeDuration / 100) % 2
                player.graphic.setAlpha(toggle);
            } else {
                player.graphic.setAlpha(1);
                player.hitboxGraphic.setFillStyle(player.playerColor);
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
    }

    setPlayerPosition(player, x, y) {
        player.graphic.setPosition(x, y);
    }

    setPlayerAngle(player, angle) {
        player.body.setRotation(angle);
    }

    #setNextBallSpawnInformation(nextSpawnInformation)
    {
        const ballRadius = 15
        const lineLength = 2* ballRadius;
        const spawnIndicator = this.add.circle(0, 0, ballRadius, 0xffffff);
        const initialDirectionLine = this.add.line(0, 0, -1/2 * lineLength, 0, 1/2 * lineLength, 0, 0x22dddd);
        initialDirectionLine.setRotation(nextSpawnInformation.angle + Math.PI);

        if (this.nextBallSpawnIndicator)
        {
            this.nextBallSpawnIndicator.setAlpha(0); // Hide previous container if necessary
        }
        this.nextBallSpawnIndicator = this.add.container(nextSpawnInformation.spawn.x, nextSpawnInformation.spawn.y, [initialDirectionLine, spawnIndicator]);
        this.nextSpawnInformation = Object.assign({ nextSpawnTimerStart: Date.now()}, nextSpawnInformation);
    }

    #handleStateEvents() {
        this.events.forEach(e => {
            switch (e.type) {
                case SDRGame.gameevents.NEW_BALL_SPAWN:
                    this.#setNextBallSpawnInformation(e.nextSpawnInformation);
                    break;
                case SDRGame.gameevents.PLAYER_ELIMINATED:
                    const player = this.playersById.get(e.playerId);
                    this.explosionObject = this.physics.add.sprite(player.graphic.x, player.graphic.y);
                    this.explosionObject.play('elim_anim');
                    this.eliminationAudio.play();
                    setTimeout(() => {
                        this.explosionObject.destroy();
                        this.eliminationAudio.stop();
                    }, 2000);
                    break;
                default:
                    break;
            }
        });

        this.events = [];
    }

    /**
     * Method to update the alpha value for this.nextBallSpawnContainer to allow for "blinking" to indicate where/when ball will spawn
     * @returns Nothing - sets alpha for this.nextBallSpawnContainer
     */
    #updateNextBallSpawnIndicator()
    {
        // If next spawn not declared, skip this process
        if (!this.nextSpawnInformation)
        {
            return;
        }

        const timeElapsedSinceNextSpawnSet = (Date.now() - this.nextSpawnInformation.nextSpawnTimerStart);
        // If ball should have spawned, set alpha to 0 so next spawn indicator isn't distracting/inaccurate
        if (timeElapsedSinceNextSpawnSet >= this.nextSpawnInformation.nextSpawnTimingMs)
        {
            this.nextBallSpawnIndicator.setAlpha(0);
        }
        else
        {
            this.nextBallSpawnIndicator.setAlpha(this.#getNextSpawnOpacity(timeElapsedSinceNextSpawnSet));
        }
    }

    /**
     * Helper method to determine the opacity of the next spawn container to represent how fast it should be blinking
     * frequencyScale determines the frequency/how many blinks between when the next spawn is declared and when we expect it to spawn
     * The calculation is a sin wave between 1 and 0 with increasing frequency as timeElapsedSinceNextSpawnSet approaches this.nextSpawnInformation.INTERVAL_TIMING_MS
     * @param {int} timeElapsedSinceNextSpawnSet Time between when next spawn was declared and current time
     * @returns
     */
    #getNextSpawnOpacity(timeElapsedSinceNextSpawnSet)
    {
        const frequencyScale = 100 / Math.pow(this.nextSpawnInformation.nextSpawnTimingMs/1000, 2)
        return 0.5 * Math.sin(frequencyScale * Math.pow(timeElapsedSinceNextSpawnSet/1000,2))+0.5
    }

    handleGameUpdate(msg) {
        switch (msg.type) {
            case SDRGame.Messaging.GameUpdates.GAME_OVER:
                this.infoLabel.setText('Game Over');
                setTimeout(() => this._transitionToScoreboard(msg.scoreboard), 3000);
                break;
            default:
                break;
        }
    }

    _transitionToScoreboard(scoreboard) {
        const scoreboardWithPlayers = scoreboard.map(playerId => {
            const player = this.playersById.get(playerId);
            return {
                name: player.name,
                color: player.color
            };
        });

        this._startNewScene('scoreboard', {
            network: this.network,
            scoreboard: scoreboardWithPlayers
        });
    }

    _startNewScene(sceneName, sceneData) {
        this.network.lobby.unsubscribeFromAll();

        this.scene.start(sceneName, sceneData);
    }
}
