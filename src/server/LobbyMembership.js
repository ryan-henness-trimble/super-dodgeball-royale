const { v4 } = require('uuid');
const uuid = v4;
const { GameTracker } = require('./GameTracker');
const { PlayerCustomizationManager } = require('./PlayerCustomizationManager');

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

    getLobby(lobbyCode) {
        return this.lobbies.get(lobbyCode);
    }

    getLobbyByPlayer(playerId) {
        const code = this.playerIdToLobbyCode.get(playerId);
        return this.lobbies.get(code);
    }

    getLobbyState(lobbyCode) {
        return this.getLobby(lobbyCode)?.toDataObject();
    }

    getLobbyStateByPlayer(playerId) {
        return this.getLobbyByPlayer(playerId)?.toDataObject();
    }

    addPlayerToLobby(playerId, lobbyCode) {
        const lobby = this.lobbies.get(lobbyCode);

        lobby.addMember(playerId);
        this.playerIdToLobbyCode.set(playerId, lobbyCode);
    }

    updateLobbyByPlayer(lobbyMemberId, playerCustomization)
    {
        const lobby = this.getLobbyByPlayer(lobbyMemberId);
        return lobby == null ? false :
            lobby.updateMember(new LobbyMember(lobbyMemberId, playerCustomization));
    }

    removePlayerFromLobby(playerId, lobbyCode) {
        if (!this.playerIsInALobby(playerId)) {
            return false;
        }

        const lobby = this.lobbies.get(lobbyCode);

        lobby.removeMember(playerId);
        this.playerIdToLobbyCode.delete(playerId);

        if (lobby.isEmpty()) {
            this.deleteLobby(lobbyCode);
        }

        return true;
    }

    removeUnusedLobbiesHostedByPlayer(playerId) {
        const playerUnusedLobbies = Array.from(this.lobbies.entries())
            .filter(([_, lobby]) => lobby.isEmpty() && lobby.hostId === playerId)
            .map(([code, _]) => code);

        playerUnusedLobbies.forEach((code) => this.deleteLobby(code));
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

    deleteLobby(lobbyCode) {
        if (this.lobbies.has(lobbyCode)) {
            const lobby = this.lobbies.get(lobbyCode);
            lobby.cleanupForDeletion();
            this.lobbies.delete(lobbyCode);
        }
    }
}

class Lobby {

    constructor(hostId) {
        this.code = uuid();
        this.members = [];
        this.playerCustomizationManager = new PlayerCustomizationManager();
        this.hostId = hostId;
        this.lastPlayerNumber = 1;
        this.game = new GameTracker();

        this.playerAcknowledgement = null;
    }

    addMember(playerId) {
        const validPlayerCustomization = this.playerCustomizationManager.generateValidPlayerCustomization(`Player ${this.lastPlayerNumber}`);
        const newMember = new LobbyMember(playerId, validPlayerCustomization);
        this.members.push(newMember);
        this.playerCustomizationManager.setPlayerCustomization(newMember);
        this.lastPlayerNumber += 1;
    }

    removeMember(playerId) {
        const idx = this.members.findIndex(m => m.playerId === playerId);
        if (idx === -1) {
            return false;
        }

        this.members.splice(idx, 1);
        this.playerCustomizationManager.removePlayerCustomization(playerId);

        if (this.members.length === 0) {
            this.hostId = '';
        } else if (playerId === this.hostId) {
            this.hostId = this.members[0].playerId;
        }

        return true;
    }

    updateMember(lobbyMember)
    {
        const idx = this.members.findIndex(m => m.playerId === lobbyMember.playerId);
        if (idx === -1) {
            return false;
        }

        const updatedCustomization = this.playerCustomizationManager.setPlayerCustomization(lobbyMember);
        if (!updatedCustomization)
        {
            return false;
        }
        else
        {
            this.members[idx] = lobbyMember;
            return true;
        }
    }

    resetPlayerAcknowledgements() {
        const playerIds = this.members.map(m => m.playerId);
        this.playerAcknowledgement = new AcknowledgementTracker(playerIds);
    }

    markAsAcknowlegded(playerId) {
        this.playerAcknowledgement.markAsAcknowledged(playerId);
    }

    allPlayersReady() {
        return this.playerAcknowledgement.allAcknowledged();
    }

    isEmpty() {
        return this.members.length === 0;
    }

    setUpNewGame() {
        return this.game.setUpNewGame(this.members);
    }

    cleanupForDeletion() {
        this.game.stopGameLoop();
    }

    toDataObject() {
        return {
            code: this.code,
            host: this.hostId,
            members: this.members.map(m => {
                return {
                    id: m.playerId,
                    name: m.name,
                    playerColor: m.playerColor,
                    shieldColor: m.shieldColor,
                };
            })
        };
    }

    toJSON() {
        return this.toDataObject();
    }
}

class LobbyMember {

    constructor(playerId, playerCustomization) {
        this.playerId = playerId;
        this.name = playerCustomization.name;
        this.playerColor = playerCustomization.playerColor; 
        this.shieldColor = playerCustomization.shieldColor;
    }
}

class AcknowledgementTracker {

    constructor(expectedIds){
        this.expected = expectedIds;
        this.received = [];
    }

    markAsAcknowledged(id) {
        this.received.push(id);
    }

    allAcknowledged() {
        return this.expected.length === this.received.length;
    }
}

function getRandomColor() {
    const letters = '6789ABCDEF';
    // let color = '#';
    let color = '';
    for (var i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 10)];
    }
    return parseInt(color, 16);
}

function hsvToRgb(h, s, v) {
    let r, g, b;
  
    let i = Math.floor(h * 6);
    let f = h * 6 - i;
    let p = v * (1 - s);
    let q = v * (1 - f * s);
    let t = v * (1 - (1 - f) * s);
  
    switch (i % 6) {
        case 0: r = v, g = t, b = p; break;
        case 1: r = q, g = v, b = p; break;
        case 2: r = p, g = v, b = t; break;
        case 3: r = p, g = q, b = v; break;
        case 4: r = t, g = p, b = v; break;
        case 5: r = v, g = p, b = q; break;
    }
  
    return [ r * 255, g * 255, b * 255 ];
}

exports.LobbyMembership = LobbyMembership;
