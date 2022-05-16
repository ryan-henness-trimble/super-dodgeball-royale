const { GameClient } = require('./GameClient');
const { Simulation } = require('../server/Simulation');
const { gameevents } = require('../shared/gameevents');
const { gameconstants } = require('../shared/gameconstants');
const { Messaging } = require('../shared/Messaging');
const Matter = require('matter-js');

global.window.SDRGame = {
    GameClient,
    Simulation,
    Messaging,
    gameevents,
    GameConstants: gameconstants,
    Matter
};
