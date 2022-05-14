const { GameClient } = require('./GameClient');
const { Simulation } = require('../server/Simulation');
const Matter = require('matter-js');

global.window.SDRGame = {
    GameClient,
    Simulation,
    Matter
};
