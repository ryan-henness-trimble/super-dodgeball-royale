const { GameClient } = require('./GameClient');
const { ServerConnection } = require('./ServerConnection');
const { gameevents } = require('../shared/gameevents');
const { gameconstants } = require('../shared/gameconstants');
const { Messaging } = require('../shared/Messaging');
const { Configuration } = require('../shared/appsettings');

// TODO remove GameClient
global.window.SDRGame = {
    GameClient,
    ServerConnection,
    Messaging,
    gameevents,
    GameConstants: gameconstants,
    Configuration
};
