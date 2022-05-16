const channels = {
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

    SIM_UPDATES: 'sim-updates',
    SIM_COMMANDS: 'sim-commands',
};

exports.channels = channels;
