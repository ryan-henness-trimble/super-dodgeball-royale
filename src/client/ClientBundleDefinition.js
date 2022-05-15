const { GameClient } = require('./GameClient');
const { Simulation } = require('../server/Simulation');
const { gameevents } = require('../shared/gameevents');
const Matter = require('matter-js');

global.window.SDRGame = {
    GameClient,
    Simulation,
    gameevents,
    Matter
};
