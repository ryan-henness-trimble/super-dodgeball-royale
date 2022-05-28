class SceneMain extends Phaser.Scene {

    constructor() {
        super('main');
    }

    preload() { }

    create() {
        const network = this.connectToServer();

        const debugBtn = document.getElementById('log-debug-info');
        debugBtn.onclick = () => {
            network.socket.emit('a', (x) => console.log(x));
        };

        this.scene.start('home', {
            network,
            messages: []
        });
    }

    connectToServer() {
        const serverUrl = SDRGame.Configuration.serverConnectionUrl;
        const options = {};
        // const options = {
        //     cors: {
        //         origin: "*",
        //         methods: ["GET", "POST"]
        //     },
        //     transports: ["websocket", "polling"],
        //     extraHeaders: {
        //         "Access-Control-Allow-Origin": "*"
        //     }
        // };
        return new SDRGame.ServerConnection(serverUrl, options);
    }
}
