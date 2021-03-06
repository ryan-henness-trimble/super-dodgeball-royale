class SceneScoreboard extends Phaser.Scene {

    constructor() {
        super('scoreboard');
    }

    preload() {
        this.load.audio('airhorn', ['assets/audio/airhorn.mp3']);
        this.load.audio('cheer', ['assets/audio/cheer.wav']);
    }

    create({ network, scoreboard }) {
        this.network = network;

        this.airhorn = this.sound.add('airhorn', { loop: false, volume: 0.2 });
        this.cheer = this.sound.add('cheer', { loop: false, volume: 0.2 });

        this.add.text(100, 100, 'Scoreboard');

        scoreboard.forEach((p, i) => {
            const playerBall = this.add.circle(40, 0, SDRGame.GameConstants.PLAYER_HITBOX_RADIUS, p.color);
            const playerLabel = this.add.text(80, -10, this._formatNameWithRank(p.name, i+1));

            const playerObjects = [playerBall, playerLabel];

            this.add.container(200, 200 + i * 40, playerObjects);
        });

        this.createLobbyReturnButton();
        this.createWaitingMessage();

        if (this.network.lobby.playerId === this.network.lobby.lobbyState.host) {
            this.showLobbyButton();
        } else {
            this.showWaitingMessage();
        }

        this.network.lobby.subscribeToGameUpdates(this.handleGameUpdate.bind(this));
        this.network.lobby.subscribeToLobbyUpdates((lobbyState) => {
            if (this.network.lobby.playerId === lobbyState.host) {
                this.hideWaitingMessage();
                this.showLobbyButton();
            }
        });

        this.playScoreboardSounds();

        const msg = SDRGame.Messaging.GameCommands.createOnScoreboard();
        this.network.lobby.sendGameCommand(msg);
    }

    handleGameUpdate(msg) {
        switch (msg.type) {
            case SDRGame.Messaging.GameUpdates.RETURNING_TO_LOBBY:
                this.network.lobby.unsubscribeFromAll();
                this.stopScoreboardSounds();

                this.scene.start('lobby', {
                    network: this.network
                });
                break;
            default:
                break;
        }
    }

    playScoreboardSounds() {
        this.airhorn.play();
        this.cheer.play();
    }

    stopScoreboardSounds() {
        this.airhorn.stop();
        this.cheer.stop();
    }

    createLobbyReturnButton() {
        const btnBack = this.add.rectangle(0, 0, 200, 40, 0x109ce8)
            .setInteractive({ cursor: 'pointer' })
            .on('pointerover', () => {
                btnBack.setFillStyle(0x4fb9f3);
            })
            .on('pointerout', () => {
                btnBack.setFillStyle(0x109ce8);
            })
            .on('pointerdown', () => {
                const msg = SDRGame.Messaging.GameCommands.createReturnToLobby();
                this.network.lobby.sendGameCommand(msg);
            });
        const btnText = this.add.text(-75, -7, 'Return to Lobby');
        this.backToLobbyBtn = this.add.container(400, 100, [btnBack, btnText]);

        this.hideLobbyButton();
    }

    hideLobbyButton() {
        this.backToLobbyBtn.setActive(false);
        this.backToLobbyBtn.setVisible(false);
    }

    showLobbyButton() {
        this.backToLobbyBtn.setActive(true);
        this.backToLobbyBtn.setVisible(true);
    }

    createWaitingMessage() {
        this.waitingMessage = this.add.text(400, 100, 'Waiting for host to choose next action');
        this.hideWaitingMessage();
    }

    showWaitingMessage() {
        this.waitingMessage.setAlpha(1);
    }

    hideWaitingMessage() {
        this.waitingMessage.setAlpha(0);
    }

    _formatNameWithRank(name, rank) {
        return `${this._getRankString(rank)} ${name}`;
    }

    _getRankString(rank) {
        switch (rank) {
            case 1:
                return '1st';
            case 2:
                return '2nd';
            case 3:
                return '3rd';
            default:
                return rank + 'th';
        }
    }
}
