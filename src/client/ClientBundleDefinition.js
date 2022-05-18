const { GameClient } = require('./GameClient');
const { gameevents } = require('../shared/gameevents');
const { gameconstants } = require('../shared/gameconstants');
const { Messaging } = require('../shared/Messaging');

global.window.SDRGame = {
    GameClient,
    Messaging,
    gameevents,
    GameConstants: gameconstants,
};
