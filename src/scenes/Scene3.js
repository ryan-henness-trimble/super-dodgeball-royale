const { io } = window;

class Scene3 extends Phaser.Scene {
    constructor() {
        super('circle prototype');
    }

    preload() {
    }

    create() {
        this.socket = io("ws://localhost:8090");

        this.socket.on('connection ack', (value) => {
            console.log(value);
        });

        this.text1 = this.add.text(10, 10, 'placeholder1', { fill: '#00ff00' });

        this.add.text(10, 70, 'Circle Testing');

        this.circles = [];

        this.input.mouse.disableContextMenu();

        this.input.on('pointerup', onMouseEvent.bind(this));

        const ox = 400;
        const oy = 300;
        const angles = [(-Math.PI), (-Math.PI / 2), 0, (Math.PI / 2)]
        const dist = 100;
        this.add.circle(ox, oy, 5, 0x00ff00);
        
        for (let a of angles)
        {
            const dx = dist * Math.cos(a);
            const dy = dist * Math.sin(a);

            this.add.circle(ox + dx, oy + dy, 5, 0xff00ff);
        }
    }

    update() {
        var pointer = this.input.activePointer;

        this.text1.setText([
            'x: ' + pointer.worldX,
            'y: ' + pointer.worldY,
            'isDown: ' + pointer.isDown
        ]);
    }
}

function onMouseEvent(pointer) {
    if (pointer.leftButtonReleased())
    {
        const getRandomAngle = Phaser.Math.Angle.Random;

        let circle = this.add.circle(pointer.worldX, pointer.worldY, 10, 0xffffff);
        this.physics.add.existing(circle);

        const speed = 200;
        let angle = getRandomAngle();
        const vx = Math.cos(angle) * speed;
        const vy = Math.sin(angle) * speed;

        // circle.body.setMaxSpeed(100);
        circle.body.setVelocityX(vx);
        circle.body.setVelocityY(vy);

        circle.body.setBounce(1);
        circle.body.setCollideWorldBounds(true);
        circle.body.setCircle(10);

        this.circles.forEach(c => this.physics.add.collider(circle, c));

        this.circles.push(circle);
    }
}

/*
this.input.on('pointerup', function (pointer) {
    if (pointer.leftButtonReleased())
    {
        var circle = new Ellipse(this, )

        text2.setText('Left Button was released');
    }
    else if (pointer.rightButtonReleased())
    {
        text2.setText('Right Button was released');
    }
    else if (pointer.middleButtonReleased())
    {
        text2.setText('Middle Button was released');
    }
    else if (pointer.backButtonReleased())
    {
        text2.setText('Back Button was released');
    }
    else if (pointer.forwardButtonReleased())
    {
        text2.setText('Forward Button was released');
    }

});
*/
