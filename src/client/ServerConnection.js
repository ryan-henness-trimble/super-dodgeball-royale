const { io } = require('socket.io-client');
const { Messaging } = require('../shared/Messaging');

const doNothing = () => {};

class LobbyConnection {

    constructor(socket) {
        this.socket = socket;

        this.lobbyState = null;
        this.lobbyUpdateCallback = doNothing;
        socket.on(Messaging.Channels.LOBBY_UPDATES, this._handleLobbyUpdate.bind(this));
        
        this.gameUpdateCallback = doNothing;
        socket.on(Messaging.Channels.GAME_UPDATES, this._handleGameUpdate.bind(this));

        this.simUpdateCallback = doNothing;
        socket.on(Messaging.Channels.SIM_UPDATES, this._handleSimUpdate.bind(this));
    }

    get playerId() {
        return this.socket.id;
    }

    sendLobbyCommand(command) {
        this.socket.emit(Messaging.Channels.LOBBY_COMMANDS, command);
    }

    sendGameCommand(command) {
        this.socket.emit(Messaging.Channels.GAME_COMMANDS, command);
    }

    sendSimCommand(command) {
        const networkCommand = Messaging.SimCommands.toNetworkFormat(command);
        this.socket.emit(Messaging.Channels.SIM_COMMANDS, networkCommand);
    }

    subscribeToLobbyUpdates(onLobbyUpdate) {
        this.lobbyUpdateCallback = onLobbyUpdate;
    }

    unsubscribeFromLobbyUpdates() {
        this.lobbyUpdateCallback = doNothing;
    }

    subscribeToGameUpdates(onGameUpdate) {
        this.gameUpdateCallback = onGameUpdate;
    }

    unsubscribeFromGameUpdates() {
        this.gameUpdateCallback = doNothing;
    }

    subscribeToSimUpdates(onSimUpdate) {
        this.simUpdateCallback = onSimUpdate;
    }

    unsubscribeFromSimUpdates() {
        this.simUpdateCallback = doNothing;
    }

    unsubscribeFromAll() {
        this.unsubscribeFromLobbyUpdates();
        this.unsubscribeFromGameUpdates();
        this.unsubscribeFromSimUpdates();
    }

    _handleLobbyUpdate(lobbyState) {
        this.lobbyState = lobbyState;

        this.lobbyUpdateCallback(lobbyState);
    }

    _handleGameUpdate(msg) {
        this.gameUpdateCallback(msg);
    }

    _handleSimUpdate(simState) {
        this.simUpdateCallback(simState);
    }
}

class ServerConnection {

    constructor(serverUrl, connectionOptions) {
        this.lobby = null;
        this.socket = io(serverUrl, connectionOptions);
    }

    joinNewLobby(onSuccess, onFailure) {
        this.socket.emit(Messaging.Channels.CREATE_LOBBY, (createResponse) => {
            if (createResponse.success) {
                this.joinExistingLobby(createResponse.lobbyCode, onSuccess, onFailure);
            } else {
                this.lobby = null;
                onFailure();
            }
        });
    }

    joinExistingLobby(lobbyCode, onSuccess, onFailure) {
        this.lobby = new LobbyConnection(this.socket);

        this.socket.emit(Messaging.Channels.JOIN_LOBBY, lobbyCode, (response) => {
            if (response.success) {
                onSuccess();
            } else {
                this.lobby = null;
                onFailure();
            }
        });
    }
}

exports.ServerConnection = ServerConnection;
