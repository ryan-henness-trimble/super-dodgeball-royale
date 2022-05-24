class SceneScoreboard extends Phaser.Scene {

    constructor() {
        super('scoreboard');
    }

    preload() { }

    create({ network, hostId, scoreboard }) {
        this.network = network;

        this.add.text(100,100, 'Scoreboard');
        
        scoreboard.forEach((p, i) => {
            const playerBall = this.add.circle(40, 0, SDRGame.GameConstants.PLAYER_HITBOX_RADIUS, p.color);

            const playerLabel = this.add.text(80, -10, `${i+1}th ${p.name}`);

            const playerObjects = [playerBall, playerLabel];

            this.add.container(200, 200 + i * 50, playerObjects);
        });

        if (this.network.playerId === hostId) {
            this.createLobbyReturnButton();
        }

        const msg = SDRGame.Messaging.GameCommands.createAckGameOver();
        this.network.sendGameCommand(msg);

        // back to lobby functionality
    }

    createLobbyReturnButton() {
        const btnBack = this.add.rectangle(0, 0, 200, 40, 0x109ce8)
            .setInteractive()
            .on('pointerdown', () => {
                
            });
        const btnText = this.add.text(-75, -7, 'Return to Lobby');
        this.startGameBtn = this.add.container(400, 100, [btnBack, btnText]);
    }

    // TODO
    // after joining a lobby, get access to lobby state object
}
