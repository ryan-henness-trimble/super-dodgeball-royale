const { GameServer } = require('./GameServer');

const cors = ['http://localhost:8080', 'https://super-dodgeball-royale.herokuapp.com'];
const s = new GameServer(cors, 'https://super-dodgeball-royale-server.herokuapp.com/');

s.startListening();
