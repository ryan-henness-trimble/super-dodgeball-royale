const { GameClient } = require('./GameClient');
const { Simulation } = require('../server/Simulation');

global.window.SDRGame = {
    GameClient,
    Simulation
};
