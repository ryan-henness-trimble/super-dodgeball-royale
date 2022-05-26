const { GameServer } = require('./GameServer');
const { Configuration } = require('../shared/appsettings');

const cors = Configuration.serverCorsOrigins;
const s = new GameServer(cors, process.env.PORT || 8090);

s.startListening();
