const { ServerConnection } = require('./ServerConnection');
const { gameevents } = require('../shared/gameevents');
const { gameconstants } = require('../shared/gameconstants');
const { Messaging } = require('../shared/Messaging');
const { Configuration } = require('../shared/appsettings');

global.window.SDRGame = {
    ServerConnection,
    Messaging,
    gameevents,
    GameConstants: gameconstants,
    Configuration
};
