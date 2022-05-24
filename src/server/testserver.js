const { GameServer } = require('./GameServer');

const cors = ['*'];
const s = new GameServer(cors, process.env.PORT || 8090);

s.startListening();
