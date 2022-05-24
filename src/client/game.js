window.onload = function() {
    let config = {
        parent: 'phaser-container',
        width: SDRGame.GameConstants.WINDOW_WIDTH,
        height: SDRGame.GameConstants.WINDOW_HEIGHT,
        backgroundColor: 0x151515,
        scene: [SceneMain, SceneHome, SceneLobby, SceneActiveGame, SceneScoreboard],
        pixelArt: true,
        physics: {
            default: 'arcade',
            arcade: {
                debug: false
            },
            matter: {
                autoUpdate: false,
                debug: false
            }
        },
        fps: {
          target: SDRGame.GameConstants.TARGET_FPS,
          forceSetTimeOut: true
        },
        dom: {
            createContainer: true
        }
    };

    const game = new Phaser.Game(config);
}
