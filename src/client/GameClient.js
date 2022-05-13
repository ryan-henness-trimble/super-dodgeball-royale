const { io } = require('socket.io-client');
const { channels } = require('../shared/channels');
const { lobbycommands } = require('../shared/lobbycommands');

class GameClient {

    constructor(serverUrl, onLobbyUpdate, onGameUpdate, onSimUpdate) {
        this.socket = io(serverUrl);
        this.lobbyUpdateHandler = onLobbyUpdate;
        this.gameUpdateHandler = onGameUpdate;
        this.simUpdateHandler = onSimUpdate;
    }

    createLobby(lobbyCodeCallback) {
        console.log('in createLobby');
        this.socket.once(channels.LOBBY_CREATED, lobbyCodeCallback);

        this.socket.emit(channels.CREATE_LOBBY);
        console.log('out createLobby');
    }

    joinLobby(lobbyCode, onSuccess, onErrorJoining) {
        this.socket.once(channels.LOBBY_JOINED, (msg) => {
            if (msg.success) {
                this.socket.on(channels.LOBBY_UPDATES, this.lobbyUpdateHandler);
                this.socket.on(channels.GAME_UPDATES, this.gameUpdateHandler);
                this.socket.on(channels.SIM_UPDATES, this.simUpdateHandler);

                onSuccess();

                this.socket.emit(channels.LOBBY_COMMANDS, lobbycommands.createAckJoin());
            } else {
                onErrorJoining();
            }
        });

        this.socket.emit(channels.JOIN_LOBBY, lobbyCode);
    }

    sendLobbyCommand(command) {
        this.socket.emit(channels.UPDATE_LOBBY, command);
    }

    sendGameCommand(command) {

    }

    sendSimCommand(command) {

    }
}

exports.GameClient = GameClient;
