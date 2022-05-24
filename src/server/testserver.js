const { GameServer } = require('./GameServer');

const cors = ['http://localhost:8080', 'https://super-dodgeball-royale.herokuapp.com'];
const s = new GameServer(cors, process.env.PORT || 8090);

s.startListening();
