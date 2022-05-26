class SceneHome extends Phaser.Scene {

    constructor() {
        super('home');
    }

    preload() { }

    create({ network, messages }) {
        const homeMessages = [...messages];

        this.network = network;

        const createLobbyBtn = document.getElementById('create-lobby-btn');

        const transitionToLobby = () => this.scene.start('lobby', { network: this.network });

        createLobbyBtn.onclick = () => {
            this.network.joinNewLobby(
                transitionToLobby,
                () => console.log('create failed')
            );
        };

        const joinLobbyBtn = document.getElementById('join-lobby-btn');
        const lobbyCodeInput = document.getElementById('lobby-code-input');

        joinLobbyBtn.onclick = () => {
            this.network.joinExistingLobby(
                lobbyCodeInput.value,
                transitionToLobby,
                () => console.log('failed to join lobby')
            );
        };

        const container = document.getElementById('lobby-controls');
        container.style.display = 'block';

        this.add.text(20, 20, 'Home');

        this.add.text(20, 60, homeMessages.join('\n'));
    }
}
