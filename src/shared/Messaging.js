const Channels = {
    // no msg
    CREATE_LOBBY: 'create-lobby',

    // lobbyCode: string
    JOIN_LOBBY: 'join-lobby',

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

const LobbyCommands = {
    LEAVE_LOBBY: 'leave-lobby',
    UPDATE_LOBBY_MEMBER: 'update-lobby-member',

    createLeaveLobby: () => createMessage(LobbyCommands.LEAVE_LOBBY),
    createUpdateLobbyMember: (playerCustomization) => createMessage(LobbyCommands.UPDATE_LOBBY_MEMBER, {
        updatedPlayerCustomization: playerCustomization
    })
};

const GameCommands = {
    START_GAME: 'start-game',
    CLIENT_READY: 'client-ready',
    ON_SCOREBOARD: 'on-scoreboard',
    RETURN_TO_LOBBY: 'return-to-lobby',

    createStartGame: () => createMessage(GameCommands.START_GAME),
    createClientReady: () => createMessage(GameCommands.CLIENT_READY),
    createOnScoreboard: () => createMessage(GameCommands.ON_SCOREBOARD),
    createReturnToLobby: () => createMessage(GameCommands.RETURN_TO_LOBBY)
}

const GameUpdates = {
    GAME_STARTING: 'game-starting',
    GAME_OVER: 'game-over',
    RETURNING_TO_LOBBY: 'returning-to-lobby',

    // walls: [{ x,y,w,h,angle }]
    // players: [{ id,hp,x,y,angle,r,color,name }]
    createGameStarting: (walls, players) => createMessage(GameUpdates.GAME_STARTING, {
        initialState: {
            walls,
            players
        }
    }),

    // playerScoreOrder: [ playerGameId ] in order of last eliminated to first eliminated
    createGameOver: (playerScoreOrder) => createMessage(GameUpdates.GAME_OVER, {
        scoreboard: playerScoreOrder
    }),

    createReturningToLobby: () => createMessage(GameUpdates.RETURNING_TO_LOBBY)
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
    GameCommands,
    GameUpdates,
    SimCommands
};
