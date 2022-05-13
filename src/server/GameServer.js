const { Server } = require('socket.io');
const { LobbyMembership } = require('./LobbyMembership');
const { channels } = require('../shared/channels');
const { lobbycommands } = require('../shared/lobbycommands');

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

        socket.on(channels.CREATE_LOBBY, () => {
            console.log('create lobby requested');

            const lobbyCode = this.lobbies.createLobby(socket.id);

            socket.emit(channels.LOBBY_CREATED, {
                success: true,
                lobbyCode: lobbyCode
            });
        });

        socket.on(channels.JOIN_LOBBY, (lobbyCode) => {
            if (this.lobbies.lobbyExists(lobbyCode)) {
                this.lobbies.addPlayerToLobby(socket.id, lobbyCode);

                socket.join(lobbyCode);

                socket.emit(channels.LOBBY_JOINED, { success: true });
            } else {
                socket.emit(channels.LOBBY_JOINED, { success: false });
            }
        });

        socket.on(channels.LOBBY_COMMANDS, (msg) => {
            this.handleLobbyCommand(socket.id, msg);
        });

        socket.on('disconnect', () => {
            console.log('player disconnected');

            this.lobbies.removeUnusedLobbiesHostedByPlayer(socket.id);

            if (this.lobbies.playerIsInALobby(socket.id)) {
                const lobby = this.lobbies.getLobbyStateByPlayer(socket.id);
                this.lobbies.removePlayerFromLobby(socket.id, lobby.code);

                if (this.lobbies.lobbyExists(lobby.code)) {
                    this.broadcastLobbyState(lobby.code);
                }
            }
        });
    }

    handleLobbyCommand(playerId, msg) {
        switch (msg.type) {
            case lobbycommands.ACK_JOIN:
                const lobby = this.lobbies.getLobbyStateByPlayer(playerId);
                this.broadcastLobbyState(lobby.code);
                break;
            case lobbycommands.LEAVE_LOBBY:
                break;
            case lobbycommands.START_GAME:
                break;
        }
    }

    broadcastLobbyState(lobbyCode) {
        this.io.to(lobbyCode).emit(channels.LOBBY_UPDATES, this.lobbies.getLobbyState(lobbyCode));
    }
}

exports.GameServer = GameServer;
