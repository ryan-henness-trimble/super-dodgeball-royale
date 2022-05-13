const { v4 } = require('uuid');
const uuid = v4;

class LobbyMembership {

    constructor() {
        this.lobbies = new Map(); // lobby code -> lobby obj
        this.playerIdToLobbyCode = new Map();
    }

    getDebugInfo() {
        const lobs = Array.from(this.lobbies.entries()).map(([_,v]) => v);
        return lobs.map((l) => {
            return {
                code: l.code,
                members: l.members,
                hostId: l.hostId,
                lastPlayerNumber: l.lastPlayerNumber
            }
        });
    }

    getLobbyState(lobbyCode) {
        return this.lobbies.get(lobbyCode).toDataObject();
    }

    getLobbyStateByPlayer(playerId) {
        const code = this.playerIdToLobbyCode.get(playerId);
        return this.lobbies.get(code).toDataObject();
    }

    addPlayerToLobby(playerId, lobbyCode) {
        const lobby = this.lobbies.get(lobbyCode);

        lobby.addMember(playerId);
        this.playerIdToLobbyCode.set(playerId, lobbyCode);
    }

    removePlayerFromLobby(playerId, lobbyCode) {
        if (!this.playerIsInALobby(playerId)) {
            return false;
        }

        const lobby = this.lobbies.get(lobbyCode);

        lobby.removeMember(playerId);
        this.playerIdToLobbyCode.delete(playerId);

        if (lobby.isEmpty()) {
            this.lobbies.delete(lobbyCode);
        }

        return true;
    }

    removeUnusedLobbiesHostedByPlayer(playerId) {
        const playerUnusedLobbies = Array.from(this.lobbies.entries())
            .filter(([_, lobby]) => lobby.isEmpty() && lobby.hostId === playerId)
            .map(([code, _]) => code);
        
        playerUnusedLobbies.forEach((code) => this.lobbies.delete(code));
    }

    createLobby(hostId) {
        const lobby = new Lobby(hostId);

        this.lobbies.set(lobby.code, lobby);

        return lobby.code;
    }

    lobbyExists(lobbyCode) {
        return this.lobbies.has(lobbyCode);
    }

    playerIsInALobby(playerId) {
        return this.playerIdToLobbyCode.has(playerId);
    }
}

class Lobby {

    constructor(hostId) {
        this.code = uuid();
        this.members = [];
        this.hostId = hostId;
        this.lastPlayerNumber = 1;
    }

    addMember(playerId) {
        const newMember = createLobbyMemberObject(playerId, `Player ${this.lastPlayerNumber}`);
        this.members.push(newMember);
        this.lastPlayerNumber += 1;
    }

    removeMember(playerId) {
        const idx = this.members.findIndex(m => m.playerId === playerId);
        if (idx === -1) {
            return false;
        }

        this.members.splice(idx, 1);

        if (this.members.length === 0) {
            this.hostId = '';
        } else if (playerId === this.hostId) {
            this.hostId = this.members[0].playerId;
        }

        return true;
    }

    isEmpty() {
        return this.members.length === 0;
    }

    toDataObject() {
        return {
            code: this.code,
            members: this.members.map(m => m.name)
        };
    }

    toJSON() {
        return this.toDataObject();
    }
}

function createLobbyMemberObject(playerId, name) {
    return {
        playerId: playerId,
        name: name
    };
}

exports.LobbyMembership = LobbyMembership;
