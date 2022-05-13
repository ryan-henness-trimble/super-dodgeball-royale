class TestingScene extends Phaser.Scene {

    constructor() {
        super('testing-scene');
        this.sim = new SDRGame.Simulation();
    }

    preload() {
        
    }

    create() {
        this.add.text(20, 20, 'Testing Scene');

        const arena = this.sim.reset();

        arena.walls.forEach(wall => this.add.rectangle(wall.x, wall.y, wall.w, wall.h, 0x000000));

        arena.players.forEach(p => this.add.circle(p.x, p.y, p.r, 0xbbbbbb));

        this.add.circle(640, 360, 10, 0xbbbbbb);
    }

    update() {

    }
}
