class SceneHome extends Phaser.Scene {

    constructor() {
        super('home');
    }

    preload() { }

    create({ network, messages }) {
        const homeMessages = [].concat(messages);

        this.network = network;

        const createLobbyBtn = document.getElementById('create-lobby-btn');

        createLobbyBtn.onclick = () => {
            this.network.createLobby((msg) => {
                if (msg.success) {
                    this.scene.start('lobby', createLobbyInput(this.network, msg.lobbyCode));
                } else {
                    // write message create failed
                    console.log('create failed');
                }
            })
        };

        const joinLobbyBtn = document.getElementById('join-lobby-btn');
        const lobbyCodeInput = document.getElementById('lobby-code-input');

        joinLobbyBtn.onclick = () => {
            this.scene.start('lobby', createLobbyInput(this.network, lobbyCodeInput.value));
        };

        const container = document.getElementById('lobby-controls');
        container.style.display = 'block';

        this.add.text(20, 20, 'Home Scene');

        this.add.text(20, 60, homeMessages.join('\n'));
    }
}

function createLobbyInput(network, lobbyCode) {
    return {
        network: network,
        code: lobbyCode
    };
}
