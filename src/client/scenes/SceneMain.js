class SceneMain extends Phaser.Scene {

    constructor() {
        super('main');

        // TODO pull this from appsettings
        this.SERVER_URL = 'ws://super-dodgeball-royale-server.herokuapp.com';
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
