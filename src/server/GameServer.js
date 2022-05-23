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
    // TODO consider using the acknowledgement callback for creating/joining server

    startListening() {
        this.io = new Server({
            cors: {
                origin: this.corsOrigins
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

        socket.on(Messaging.Channels.CREATE_LOBBY, () => {
            console.log('create lobby requested');

            const lobbyCode = this.lobbies.createLobby(socket.id);

            socket.emit(Messaging.Channels.LOBBY_CREATED, {
                success: true,
                lobbyCode: lobbyCode
            });
        });

        socket.on(Messaging.Channels.JOIN_LOBBY, (lobbyCode) => {
            if (this.lobbies.lobbyExists(lobbyCode)) {
                this.lobbies.addPlayerToLobby(socket.id, lobbyCode);

                socket.join(lobbyCode);

                socket.emit(Messaging.Channels.LOBBY_JOINED, { success: true });
            } else {
                socket.emit(Messaging.Channels.LOBBY_JOINED, { success: false });
            }
        });

        socket.on(Messaging.Channels.LOBBY_COMMANDS, (msg) => {
            this.handleLobbyCommand(socket, msg);
        });

        socket.on(Messaging.Channels.GAME_COMMANDS, (msg) => {
            this.handleGameCommand(socket, msg);
        })

        socket.on(Messaging.Channels.SIM_COMMANDS, (msg) => {
            const lobby = this.lobbies.getLobbyByPlayer(socket.id);
            const command = Messaging.SimCommands.fromNetworkFormat(msg);
            lobby.game.receiveCommand(socket.id, command);
        });

        socket.on('disconnect', () => {
            console.log('player disconnected');

            this.lobbies.removeUnusedLobbiesHostedByPlayer(socket.id);

            // TODO centralize logic for cleaning up from a player leaving
            if (this.lobbies.playerIsInALobby(socket.id)) {
                const lobby = this.lobbies.getLobbyStateByPlayer(socket.id);
                this.lobbies.removePlayerFromLobby(socket.id, lobby.code);

                if (this.lobbies.lobbyExists(lobby.code)) {
                    const newState = this.lobbies.getLobbyState(lobby.code);
                    const msg = Messaging.LobbyUpdates.createNewState(newState);
                    this.broadcastLobbyUpdate(lobby.code, msg);
                }
            }
        });
    }

    handleLobbyCommand(socket, msg) {
        const playerId = socket.id;
        switch (msg.type) {
            case Messaging.LobbyCommands.ACK_JOIN:
                let lobby = this.lobbies.getLobbyStateByPlayer(playerId);
                const newLobbyState = Messaging.LobbyUpdates.createNewState(lobby);
                this.broadcastLobbyUpdate(lobby.code, newLobbyState);
                break;
            case Messaging.LobbyCommands.LEAVE_LOBBY:                
                break;
            case Messaging.LobbyCommands.UPDATE_LOBBY_MEMBER:
                this.handleUpdateLobbyMember(playerId, msg.updatedPlayerCustomization);
                break;
            case Messaging.LobbyCommands.START_GAME:
                this.handleStartGameCommand(playerId);
                break;
        }
    }

    handleGameCommand(socket, msg) {
        const playerId = socket.id;
        switch (msg.type) {
            case Messaging.GameCommands.CLIENT_READY:
                this.handlePlayerReadyCommand(playerId);
                break;
        }
    }

    handleUpdateLobbyMember(playerId, playerCustomization)
    {
        const updateApplied = this.lobbies.updateLobbyByPlayer(playerId, playerCustomization);
        if (updateApplied)
        {
            let updatedLobby = this.lobbies.getLobbyStateByPlayer(playerId);
            const updatedLobbyState = Messaging.LobbyUpdates.createNewState(updatedLobby);
            this.broadcastLobbyUpdate(updatedLobby.code, updatedLobbyState);
        }
    }

    handleStartGameCommand(playerId) {
        if (!this.lobbies.playerIsInALobby(playerId)) {
            return;
        }

        const lobby = this.lobbies.getLobbyByPlayer(playerId);

        const initialState = lobby.setUpNewGame();

        const msg = Messaging.LobbyUpdates.createGameStarting(initialState.walls, initialState.players);
        this.broadcastLobbyUpdate(lobby.code, msg);

        // need:
        // register listeners for each player's commands
    }

    handlePlayerReadyCommand(playerId) {
        if (!this.lobbies.playerIsInALobby(playerId)) {
            return;
        }

        const lobby = this.lobbies.getLobbyByPlayer(playerId);

        lobby.game.markPlayerAsReady(playerId);

        if (lobby.game.allPlayersReady()) {
            console.log('starting loop');
            const deliveryCallback = (renderState) => {
                this.broadcastSimUpdate(lobby.code, renderState);
            };

            lobby.game.startGameLoop(deliveryCallback);
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
