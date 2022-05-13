const { GameServer } = require('./GameServer');

const cors = ['http://localhost:8080'];
const s = new GameServer(cors, 8090);

s.startListening();
