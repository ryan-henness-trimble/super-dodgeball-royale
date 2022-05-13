const commands = {
    ACK_JOIN: 'ack-join',
    LEAVE_LOBBY: 'leave-lobby',
    START_GAME: 'start-game',

    createAckJoin: () => createCommandWithoutData(commands.ACK_JOIN),
};

function createCommand(type, data) {
    return {
        type: type,
        data: data
    };
}

function createCommandWithoutData(type) {
    return {
        type: type
    };
}

exports.lobbycommands = commands;
