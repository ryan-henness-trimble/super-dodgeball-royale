const { Server } = require('socket.io');
const { LobbyMembership } = require('./LobbyMembership');
const { Messaging } = require('../shared/Messaging');

class GameServer {

    constructor(corsOrigins, port) {
        this.corsOrigins = corsOrigins;
        this.port = port;
        this.io = null;
        this.lobbies = new LobbyMembership();
    }

    // TODO consider adding a timeout to socket emits for the simulation and commands

    startListening() {
        this.io = new Server({
            cors: {
                origin: this.corsOrigins,
                methods: ["GET", "POST"]
            }
        });

        this.io.on('connection', this.registerHandlers.bind(this));

        console.log(`Web Socket Server Listening on Port ${this.port}`);
        this.io.listen(this.port)
    }

    registerHandlers(socket) {
        console.log('player connected', socket.id);
        socket.on('a', (cback) => {
            cback(this.lobbies.getDebugInfo());
        });

        socket.on(Messaging.Channels.CREATE_LOBBY, (callback) => {
            console.log('create lobby requested');

            this.removePlayerFromAllLobbies(socket.id);
            const lobbyCode = this.lobbies.createLobby(socket.id);

            callback({
                success: true,
                lobbyCode: lobbyCode
            });
        });

        socket.on(Messaging.Channels.JOIN_LOBBY, (lobbyCode, callback) => {
            if (this.lobbies.playerIsInALobby(socket.id) || !this.lobbies.lobbyExists(lobbyCode)) {
                callback({ success: false });
                return;
            }

            this.lobbies.addPlayerToLobby(socket.id, lobbyCode);
            socket.join(lobbyCode);

            let lobbyState = this.lobbies.getLobbyState(lobbyCode);
            this.broadcastLobbyUpdate(lobbyCode, lobbyState);

            callback({ success: true });
        });

        socket.on(Messaging.Channels.LOBBY_COMMANDS, (msg) => {
            this.handleLobbyCommand(socket, msg);
        });

        socket.on(Messaging.Channels.GAME_COMMANDS, (msg) => {
            this.handleGameCommand(socket, msg);
        })

        socket.on(Messaging.Channels.SIM_COMMANDS, (msg) => {
            if (this.lobbies.playerIsInALobby(socket.id)) {
                const lobby = this.lobbies.getLobbyByPlayer(socket.id);
                const command = Messaging.SimCommands.fromNetworkFormat(msg);
                lobby.game.receiveCommand(socket.id, command);
            }
        });

        socket.on('disconnect', () => {
            console.log('player disconnected');

            this.removePlayerFromAllLobbies(socket.id);
        });
    }

    removePlayerFromAllLobbies(playerId) {
        this.lobbies.removeUnusedLobbiesHostedByPlayer(playerId);

        if (this.lobbies.playerIsInALobby(playerId)) {
            const lobby = this.lobbies.getLobbyStateByPlayer(playerId);
            this.lobbies.removePlayerFromLobby(playerId, lobby.code);

            if (this.lobbies.lobbyExists(lobby.code)) {
                const newState = this.lobbies.getLobbyState(lobby.code);
                this.broadcastLobbyUpdate(lobby.code, newState);
            }
        }
    }

    handleLobbyCommand(socket, msg) {
        const playerId = socket.id;
        switch (msg.type) {
            case Messaging.LobbyCommands.LEAVE_LOBBY:
                this.removePlayerFromAllLobbies(socket.id);
                break;
            case Messaging.LobbyCommands.UPDATE_LOBBY_MEMBER:
                this.handleUpdateLobbyMember(playerId, msg.updatedPlayerCustomization);
                break;
            default:
                break;
        }
    }

    handleGameCommand(socket, msg) {
        const playerId = socket.id;
        switch (msg.type) {
            case Messaging.GameCommands.START_GAME:
                this.handleStartGameCommand(playerId);
                break;
            case Messaging.GameCommands.CLIENT_READY:
                this.handlePlayerReadyCommand(playerId);
                break;
            case Messaging.GameCommands.ON_SCOREBOARD:
                this.handlePlayerOnScoreboard(playerId);
                break;
            case Messaging.GameCommands.RETURN_TO_LOBBY:
                this.handleReturnToLobby(playerId);
                break;
            default:
                break;
        }
    }

    handleUpdateLobbyMember(playerId, playerCustomization)
    {
        const updateApplied = this.lobbies.updateLobbyByPlayer(playerId, playerCustomization);
        if (updateApplied)
        {
            const updatedLobby = this.lobbies.getLobbyStateByPlayer(playerId);
            this.broadcastLobbyUpdate(updatedLobby.code, updatedLobby);
        }
    }

    handleStartGameCommand(playerId) {
        if (!this.lobbies.playerIsInALobby(playerId)) {
            return;
        }

        const lobby = this.lobbies.getLobbyByPlayer(playerId);
        if (lobby.hostId !== playerId) {
            return;
        }

        lobby.resetPlayerAcknowledgements();
        const initialState = lobby.setUpNewGame();

        const msg = Messaging.GameUpdates.createGameStarting(initialState.walls, initialState.players);
        this.broadcastGameUpdate(lobby.code, msg);
    }

    handlePlayerOnScoreboard(playerId) {
        if (!this.lobbies.playerIsInALobby(playerId)) {
            return;
        }

        const lobby = this.lobbies.getLobbyByPlayer(playerId);
        lobby.markAsAcknowlegded(playerId);
    }

    handleReturnToLobby(playerId) {
        if (!this.lobbies.playerIsInALobby(playerId)) {
            return;
        }

        const lobby = this.lobbies.getLobbyByPlayer(playerId);
        if (lobby.allPlayersReady()) {
            lobby.resetPlayerAcknowledgements();

            const msg = Messaging.GameUpdates.createReturningToLobby();
            this.broadcastGameUpdate(lobby.code, msg);
        }
    }

    handlePlayerReadyCommand(playerId) {
        if (!this.lobbies.playerIsInALobby(playerId)) {
            return;
        }

        const lobby = this.lobbies.getLobbyByPlayer(playerId);

        lobby.markAsAcknowlegded(playerId);

        if (lobby.allPlayersReady()) {
            const gameStateDelivery = (renderState) => {
                this.broadcastSimUpdate(lobby.code, renderState);
            };
            const gameOverCallback= (scoreboardOrder) => {
                lobby.resetPlayerAcknowledgements();

                const gameOverMessage = Messaging.GameUpdates.createGameOver(scoreboardOrder);
                this.broadcastGameUpdate(lobby.code, gameOverMessage);
            };

            lobby.game.startGameLoop(gameStateDelivery, gameOverCallback);
        }
    }

    broadcastLobbyUpdate(lobbyCode, msg) {
        this.io.to(lobbyCode).emit(Messaging.Channels.LOBBY_UPDATES, msg);
    }

    broadcastGameUpdate(lobbyCode, msg) {
        this.io.to(lobbyCode).emit(Messaging.Channels.GAME_UPDATES, msg);
    }

    broadcastSimUpdate(lobbyCode, msg) {
        this.io.to(lobbyCode).emit(Messaging.Channels.SIM_UPDATES, msg);
    }
}

exports.GameServer = GameServer;
