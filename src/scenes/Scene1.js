class Scene1 extends Phaser.Scene {
    constructor() {
        super('scene1');
    }

    preload() {
        this.playerSpeed = 200;
        // Load background
        this.load.image('background', '../assets/bg.png');

        // Load player
        this.load.spritesheet('player', '../assets/ship-spritesheet-t.png', {
            frameWidth: 24, frameHeight: 24
        });

        // Load powerup
        this.load.spritesheet('powerup', '../assets/lightning-t.png', {
            frameWidth: 32, frameHeight: 32
        });

        // Load enemy
        this.load.image('enemy1', '../assets/enemy1.png');
    }

    create() {
        this.background = this.add.image(0, 0, 'background');
        this.background.setOrigin(0, 0);

        this.add.text(20, 20, 'Scene 1...');

        this.physics.world.setBoundsCollision();

        // Set player
        this.player1 = this.physics.add.sprite(200, 500, 'player');
        this.player1.setScale(1.5);
        this.cursorKeys = this.input.keyboard.createCursorKeys();
        this.player1.setCollideWorldBounds(true);

        // Set player animations
        this.anims.create({
            key: 'ship_anim',
            frames: this.anims.generateFrameNumbers('player'),
            frameRate: 5,
            repeat: -1
        });
        this.player1.play('ship_anim');

        // Set powerup
        this.powerup = this.physics.add.sprite(100, 100, 'powerup');
        this.anims.create({
            key: 'powerup_anim',
            frames: this.anims.generateFrameNumbers('powerup'),
            frameRate: 10,
            repeat: -1
        });
        this.powerup.play('powerup_anim');

        this.physics.add.collider(this.player1, this.powerup, (player, powerup) => {
            powerup.destroy();
            this.playerSpeed = 800;
        });

        // Set enemy
        this.enemy1 = this.physics.add.sprite(500, 100, 'enemy1');
        this.enemy1.setCollideWorldBounds(true);
        this.enemy1.setBounce(1, 1);
        this.enemy1.setVelocityX(300);
        this.enemy1.setVelocityY(300);
        this.physics.add.collider(this.enemy1, this.player1, () => {
            // Do something when they collide!
        })

        this.player1.setImmovable(true);
    }

    update() {
        this.handlePlayerMovement();
    }

    handlePlayerMovement() {
        this.player1.setVelocity(0);

        if (this.cursorKeys.space.isDown) {
            this.scene.start("level2");
        }

        if (this.cursorKeys.left.isDown) {
            this.player1.setVelocityX(-this.playerSpeed);
        } else if (this.cursorKeys.right.isDown) {
            this.player1.setVelocityX(this.playerSpeed);
        }

        if (this.cursorKeys.up.isDown) {
          this.player1.setVelocityY(-this.playerSpeed);
        } else if (this.cursorKeys.down.isDown) {
          this.player1.setVelocityY(this.playerSpeed);
        }
    }
}
