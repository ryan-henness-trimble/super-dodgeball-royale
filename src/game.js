window.onload = function() {
    let config = {
        width: 350,
        height: 550,
        backgroundColor: 0x0000ff,
        scene: [Scene1, Scene2],
        pixelArt: true,
        physics: {
            default: 'arcade',
            arcade: {
                debug: false
            }
        },
        fps: {
          target: 60,
          forceSetTimeOut: true
        }
    };

    let game = new Phaser.Game(config);
}
