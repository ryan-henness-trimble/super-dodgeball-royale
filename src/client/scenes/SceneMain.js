class SceneMain extends Phaser.Scene {

    constructor() {
        super('main');

        // TODO pull this from appsettings
        this.SERVER_URL = process.env.WS_HOST | 'ws://localhost:8090';
    }

    preload() { }

    create() {
        this.add.text(20, 20, 'Main Scene');

        const network = new SDRGame.GameClient(this.SERVER_URL);

        const debugBtn = document.getElementById('log-debug-info');

        debugBtn.onclick = () => {
            network.socket.emit('a', (x) => console.log(x));
        };

        this.scene.start('home', {
            network,
            messages: []
        });
    }
}
