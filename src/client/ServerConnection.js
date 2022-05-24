const { io } = require('socket.io-client');
const { Messaging } = require('../shared/Messaging');

const doNothing = () => {};

class LobbyConnection {

    constructor(socket) {
        this.socket = socket;

        this.lobbyState = null;
        this.lobbyUpdateCallback = doNothing;

        socket.on(Messaging.Channels.LOBBY_UPDATES, this._handleLobbyUpdate.bind(this));
    }

    get playerId() {
        return this.socket.id;
    }

    subscribeToLobbyUpdates(onLobbyUpdate) {
        this.lobbyUpdateCallback = onLobbyUpdate;
    }

    unsubscribeFromLobbyUpdates() {
        this.lobbyUpdateCallback = doNothing;
    }

    _handleLobbyUpdate(newState) {
        this.lobbyState = newState;

        this.lobbyUpdateCallback(newState);
    }
}

class ServerConnection {

    constructor(serverUrl) {
        this.socket = io(serverUrl);
    }

    joinNewLobby(onSuccess, onFailure) {
        this.socket.emit(Messaging.Channels.CREATE_LOBBY, (createResponse) => {
            if (createResponse.success) {
                this.socket.emit(Messaging.Channels.JOIN_LOBBY, createResponse.lobbyCode, (joinResponse) => {
                    if (joinResponse.success) {
                        const lobbyConnection = new LobbyConnection(this.socket);
                        onSuccess(lobbyConnection);
                    } else {
                        onFailure();
                    }
                });
            } else {
                onFailure();
            }
        });
    }

    joinExistingLobby(lobbyCode, onSuccess, onFailure) {

    }
}

exports.ServerConnection = ServerConnection;
