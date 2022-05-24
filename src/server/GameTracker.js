const { Simulation } = require('./Simulation');
const { gameconstants } = require('../shared/gameconstants');

class GameTracker {

    constructor() {
        this.currentCommands = new Map();
        this.playerIdsToGameIds = new Map();

        this.readyPlayers = [];

        this.sim = new Simulation();

        this.gameLoop = null;

        this.renderStateCallback = () => {};
        this.gameOverCallback = () => {};

        this.TIMESTEP_MS = 1000 / gameconstants.TARGET_FPS;
    }

    setUpNewGame(players) {
        this.stopGameLoop();

        this.readyPlayers = [];

        const playerIds = players.map(p => p.playerId);

        // const mapName = 'basic';
        const mapName = 'map-demo';
        const numPlayers = playerIds.length;

        const initialState = this.sim.reset(mapName, numPlayers);

        // set default commands
        this.currentCommands.clear();
        this.addDefaultCommandForEachPlayer(playerIds);

        // map ids
        this.playerIdsToGameIds.clear();
        initialState.players.forEach((p, i) => {
            this.playerIdsToGameIds.set(playerIds[i], p.id)

            p.name = players[i].name;
            p.playerColor = players[i].playerColor;
            p.shieldColor = players[i].shieldColor;
        });

        return initialState;
    }

    markPlayerAsReady(playerId) {
        this.readyPlayers.push(playerId);
    }

    allPlayersReady() {
        return this.readyPlayers.length === this.playerIdsToGameIds.size;
    }

    startGameLoop(renderStateCallback, onGameOver) {
        this.stopGameLoop();
        this.renderStateCallback = renderStateCallback;
        this.gameOverCallback = onGameOver;
        this.gameLoop = setInterval(this.executeGameStep.bind(this), this.TIMESTEP_MS);
    }

    stopGameLoop() {
        if (this.gameLoop) {
            this.renderStateCallback = () => {};
            this.gameOverCallback = () => {};
            clearInterval(this.gameLoop);
        }
    }

    executeGameStep() {
        const commands = Array.from(this.currentCommands.entries()).map(([id, c]) => {
            const gameId = this.playerIdsToGameIds.get(id);
            return Object.assign({ id: gameId }, c);
        });

        this.sim.step(commands, this.TIMESTEP_MS);

        this.renderStateCallback(this.sim.getState());

        if (this.sim.gameIsOver()) {
            this.gameOverCallback(this.sim.getPlayerScoreboardOrder());
            this.stopGameLoop();
        }
    }

    receiveCommand(playerId, command) {
        this.currentCommands.set(playerId, command);
    }

    addDefaultCommandForEachPlayer(playerIds) {
        playerIds.forEach(id => this.currentCommands.set(id, {
            up: false,
            down: false,
            left: false,
            right: false,
            cw: false,
            ccw: false
        }));
    }
}

// expected player command format:
// {
//     move: up,down,left,right,cw,ccw bit field
// }

exports.GameTracker = GameTracker;
