class DevSceneSelector extends Phaser.Scene {
    constructor() {
        super('devSceneSelector');
    }

    preload() {
        // Load background
        this.load.image('background', '../assets/bg.png');
    }

    create() {
        this.add.text(100, 25, "Select Scene", { fontSize: 24 });
        this.game.scene.scenes.forEach((scene, index) => {
            const sceneKey = scene.sys.settings.key;
            if (sceneKey != this.sys.settings.key)
            {
                let sceneButton = this.add.text(100, 50+25*(index), sceneKey);
                sceneButton.setInteractive();
                sceneButton.on("pointerdown", this.startScene.bind(this, sceneKey));
            }
        });
    }

    startScene(sceneKey)
    {
        this.scene.start(sceneKey);
    }
}
