// Set USE_LOCAL_SETTINGS based on your development
// Remember to change it back before merging to main
const USE_LOCAL_SETTINGS = true;

const localSettings = {
    serverConnectionUrl: 'ws://localhost:8090',
    serverCorsOrigins: ['http://localhost:8080']
};

const deployedSettings = {
    serverConnectionUrl: 'wss://super-dodgeball-royale-server.herokuapp.com',
    serverCorsOrigins: ['*']
};

const Configuration = USE_LOCAL_SETTINGS ? localSettings : deployedSettings;

exports.Configuration = Configuration;
