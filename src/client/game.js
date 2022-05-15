window.onload = function() {
    let config = {
        width: 1280,
        height: 720,
        backgroundColor: 0x555555,
        scene: [TestingScene],
        pixelArt: true,
        physics: {
            default: 'arcade',
            arcade: {
                debug: false
            },
            matter: {
                autoUpdate: true,
                debug: true
            }
        },
        fps: {
          target: 60,
          forceSetTimeOut: true
        }
    };

    const game = new Phaser.Game(config);
}
