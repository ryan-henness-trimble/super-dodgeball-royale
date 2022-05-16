const Channels = {
    // no msg
    CREATE_LOBBY: 'create-lobby',

    // lobbyCode: string
    JOIN_LOBBY: 'join-lobby',

    // {
    // success: bool,
    // lobbyCode: string
    // }
    LOBBY_CREATED: 'lobby-created',

    // {
    // success: bool
    // }
    LOBBY_JOINED: 'lobby-joined',

    // client to server
    // {
    //     command: 'ack-join' | 'leave-lobby' | 'start-game'
    // }
    LOBBY_COMMANDS: 'lobby-commands',

    LOBBY_UPDATES: 'lobby-updates',
    // players in lobby: names, avatars

    // {
    //     type: 'game-starting'
    //     data: sim initial state
    // }
    GAME_UPDATES: 'game-updates',
    GAME_COMMANDS: 'game-commands',

    // sim commands and updates are not polymorphic
    SIM_UPDATES: 'sim-updates',
    SIM_COMMANDS: 'sim-commands',
};

const LobbyUpdates = {
    NEW_STATE: 'new-state',
    GAME_STARTING: 'game-starting',

    createNewState: (lobbyState) => createMessage(LobbyUpdates.NEW_STATE, {
        state: lobbyState
    }),

    // walls: [{ x,y,w,h,angle }]
    // players: [{ id,hp,x,y,angle,r,color,name }]
    createGameStarting: (walls, players) => createMessage(LobbyUpdates.GAME_STARTING, {
        initialState: {
            walls,
            players
        }
    })
}

const LobbyCommands = {
    ACK_JOIN: 'ack-join',
    LEAVE_LOBBY: 'leave-lobby',
    START_GAME: 'start-game',

    createAckJoin: () => createMessage(LobbyCommands.ACK_JOIN),
    createLeaveLobby: () => createMessage(LobbyCommands.LEAVE_LOBBY),
    createStartGame: () => createMessage(LobbyCommands.START_GAME)
};

const GameCommands = {
    CLIENT_READY: 'client-ready',

    createClientReady: () => createMessage(GameCommands.CLIENT_READY)
}

const GameUpdates = {
    SENDING_SIM_UPDATES: 'sending-sim-updates',

    createSendingSimUpdates: () => createMessage(GameUpdates.SENDING_SIM_UPDATES)
}

const SimCommands = {
    UP:    0b000001,
    DOWN:  0b000010,
    LEFT:  0b000100,
    RIGHT: 0b001000,
    CW:    0b010000,
    CCW:   0b100000,

    toNetworkFormat: (c) => {
        let movement = 0b000000;

        movement |= addBitmaskOnCondition(c.up, SimCommands.UP);
        movement |= addBitmaskOnCondition(c.down, SimCommands.DOWN);
        movement |= addBitmaskOnCondition(c.left, SimCommands.LEFT);
        movement |= addBitmaskOnCondition(c.right, SimCommands.RIGHT);
        movement |= addBitmaskOnCondition(c.cw, SimCommands.CW);
        movement |= addBitmaskOnCondition(c.ccw, SimCommands.CCW);
        
        return {
            move: movement
        };
        // return c;
    },

    fromNetworkFormat: (c) => {
        const command = {
            up: !!(c.move & SimCommands.UP),
            down: !!(c.move & SimCommands.DOWN),
            left: !!(c.move & SimCommands.LEFT),
            right: !!(c.move & SimCommands.RIGHT),
            cw: !!(c.move & SimCommands.CW),
            ccw: !!(c.move & SimCommands.CCW)
        }

        return command;
        // return c;
    }
}

function createMessage(type, payload = null) {
    return Object.assign({ type: type }, payload);
}

function addBitmaskOnCondition(condition, bitmask) {
    return condition ? bitmask : 0b000000;
}

exports.Messaging = {
    Channels,
    LobbyCommands,
    LobbyUpdates,
    GameCommands,
    GameUpdates,
    SimCommands
};
