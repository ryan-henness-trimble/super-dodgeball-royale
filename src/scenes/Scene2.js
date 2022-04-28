class Scene2 extends Phaser.Scene {
    constructor() {
        super('level2');
    }

    preload() {
        // Load background
        this.load.image('background', '../assets/bg.png');
    }

    create() {
        this.background = this.add.image(0, 0, 'background');
        this.background.setOrigin(0, 0);

        this.add.text(20, 20, 'Scene 2...');
    }
}
