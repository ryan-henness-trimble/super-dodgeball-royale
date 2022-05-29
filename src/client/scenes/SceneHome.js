class SceneHome extends Phaser.Scene {

    constructor() {
        super('home');

        this.GameConstants = SDRGame.GameConstants;
    }

    preload() { 
        this.load.image('background', '../assets/img/bg.png');
        this.load.image('title', '../assets/img/title.png');
        this.load.html('lobbyCodeInput', '../assets/html/lobbyCodeInput.html');
    }

    create({ network, messages }) {
        const homeMessages = [...messages];

        this.network = network;

        const createLobbyBtn = document.getElementById('create-lobby-btn');
        const bg = this.add.image(this.GameConstants.WINDOW_WIDTH/2, this.GameConstants.WINDOW_HEIGHT/2, 'background')
        bg.setOrigin(0.5,0.5)
        bg.displayWidth = this.GameConstants.WINDOW_WIDTH;
        bg.displayHeight = this.GameConstants.WINDOW_HEIGHT;

        this.createTitleAndButtonContainer();

        this.add.text(20, 20, 'Home');

        this.add.text(20, 60, homeMessages.join('\n'));
    }

    createTitleAndButtonContainer()
    {
        const title = this.add.image(0, -this.GameConstants.WINDOW_HEIGHT/4, 'title')
        const containerBackground = this.add.rectangle(0, 0, title.width, this.GameConstants.WINDOW_HEIGHT/2 + title.height, 0x000000);
        containerBackground.setOrigin(0.5, 0.5)

        const transitionToLobby = () => this.scene.start('lobby', { network: this.network });

        const createLobbyButton = this.createButtonObject(0, 0, 'Create Lobby', () => {
            this.network.joinNewLobby(
                transitionToLobby,
                () => console.log('create failed')
            );
        });

        const lobbyCodeInput = this.add.dom(0, 75).createFromCache('lobbyCodeInput');
        let lobbyCodeDom = document.getElementById("lobbyCode");
        const joinLobbyButton = this.createButtonObject(0, 150, 'Join Lobby', () => {
            this.network.joinExistingLobby(
                lobbyCodeDom.value,
                transitionToLobby,
                () => console.log('failed to join lobby')
            );
        });

        const container = this.add.container(this.GameConstants.WINDOW_WIDTH/2, this.GameConstants.WINDOW_HEIGHT/2, [containerBackground, createLobbyButton, lobbyCodeInput, joinLobbyButton, title]);
    }

    createButtonObject(x, y, label, onClick) {
        const btnText = this.add.text(0, 0, label);
        btnText.setOrigin(0.5, 0.5);
        const btnBack = this.add.rectangle(0, 0, btnText.width + 30, 40, 0x109ce8)
            .setInteractive()
            .on('pointerdown', onClick);
        
        return this.add.container(x, y, [btnBack, btnText]);
    }
}
