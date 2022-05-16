class SceneLobby extends Phaser.Scene {

    constructor() {
        super('lobby');

        this.GameConstants = SDRGame.GameConstants;
    }

    preload() { }

    create({ network, code }) {
        this.network = network;

        const container = document.getElementById('lobby-controls');
        container.style.display = 'none';

        network.joinLobby(
            code,
            () => console.log('joined lobby'),
            () => this.scene.start('home', {
                network,
                messages: ['Failed to join lobby']
            }),
            this.handleLobbyUpdate.bind(this)
        );

        this.add.text(20, 20, 'Lobby Scene');

        this.codeLabel = this.add.text(20, 50, 'Code:')
        this.playersLabel = this.add.text(20, 80, 'Players:');

        this.playerGraphicsList = [];

        this.createStartButton();
    }

    handleLobbyUpdate(msg) {
        switch (msg.type) {
            case SDRGame.Messaging.LobbyUpdates.NEW_STATE:
                this.receiveNewState(msg.state);
                break;
            case SDRGame.Messaging.LobbyUpdates.GAME_STARTING:
                console.log('switching scenes');
                this.scene.start('active-game', {
                    network: this.network,
                    initialState: msg.initialState
                });
                break;
        }
    }

    receiveNewState(lobbyState) {
        // code
        // host
        // members [{ id, name, color }]

        const codeStr = `Code: ${lobbyState.code}`;
        this.codeLabel.setText(codeStr);
        console.log(codeStr);

        this.playerGraphicsList.forEach(p => p.destroy());
        this.playerGraphicsList = [];
        lobbyState.members.forEach((m, i) => {
            const playerBall = this.add.circle(40, 0, this.GameConstants.PLAYER_HITBOX_RADIUS, m.color);

            const name = m.id === this.network.playerId
                ? `${m.name} (you)`
                : m.name;
            const playerLabel = this.add.text(80, -10, name);

            const playerObjects = [playerBall, playerLabel];

            if (m.id === lobbyState.host) {
                const hostIndicator = this.add.rectangle(0, 0, 10, 10, 0xe8d210);
                playerObjects.push(hostIndicator);
            }

            const container = this.add.container(40, 130 + 50 * i, playerObjects);

            this.playerGraphicsList.push(container);
        });

        if (this.network.playerId === lobbyState.host) {
            this.showStartButton();
        } else {
            this.hideStartButton();
        }
    }

    createStartButton() {
        const btnBack = this.add.rectangle(0, 0, 140, 40, 0x109ce8)
            .setInteractive()
            .on('pointerdown', () => {
                const command = SDRGame.Messaging.LobbyCommands.createStartGame();
                this.network.sendLobbyCommand(command);
            });
        const btnText = this.add.text(-50, -10, 'Start Game');
        this.startGameBtn = this.add.container(600, 50, [btnBack, btnText]);

        this.hideStartButton();
    }

    hideStartButton() {
        this.startGameBtn.setActive(false);
        this.startGameBtn.setVisible(false);
    }

    showStartButton() {
        this.startGameBtn.setActive(true);
        this.startGameBtn.setVisible(true);
    }
}
