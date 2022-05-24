const { io } = require('socket.io-client');
const { Messaging } = require('../shared/Messaging');
const { channels } = require('../shared/channels');
const { lobbycommands } = require('../shared/lobbycommands');

class GameClient {

    constructor(serverUrl) {
        this.socket = io(serverUrl, {
              cors: {
                transports: ["websocket", "polling"],
                withCredentials: true,
                origin: "http://localhost:8080",
                methods: ["GET", "POST"]
              }
        });
    }

    get playerId() {
        return this.socket.id;
    }

    createLobby(lobbyCodeCallback) {
        this.socket.once(Messaging.Channels.LOBBY_CREATED, lobbyCodeCallback);

        this.socket.emit(Messaging.Channels.CREATE_LOBBY);
    }

    joinLobby(lobbyCode, onSuccess, onErrorJoining, onLobbyUpdate) {
        this.socket.once(channels.LOBBY_JOINED, (msg) => {
            if (msg.success) {
                this.socket.on(Messaging.Channels.LOBBY_UPDATES, onLobbyUpdate);

                onSuccess();

                this.socket.emit(Messaging.Channels.LOBBY_COMMANDS, Messaging.LobbyCommands.createAckJoin());
            } else {
                onErrorJoining();
            }
        });

        this.socket.emit(Messaging.Channels.JOIN_LOBBY, lobbyCode);
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

    subscribeToActiveGame(onGameUpdate, onSimUpdate) {
        this.socket.on(Messaging.Channels.GAME_UPDATES, onGameUpdate);
        this.socket.on(Messaging.Channels.SIM_UPDATES, onSimUpdate);
    }

    unsubscribeFromActiveGame() {
        this.socket.removeAllListeners(Messaging.Channels.GAME_UPDATES);
        this.socket.removeAllListeners(Messaging.Channels.SIM_UPDATES);
    }
}

exports.GameClient = GameClient;
