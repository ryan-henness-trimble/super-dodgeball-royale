gameevents = {
    ROUND_OVER: 0,
    PLAYER_HIT: 1,
    PLAYER_ELIMINATED: 2,
    NEW_BALL_SPAWN: 3,

    createRoundOver: function() {
        return {
            type: gameevents.ROUND_OVER
        };
    },
    createPlayerHit: function(playerId) {
        return {
            type: gameevents.PLAYER_HIT,
            playerId
        };
    },
    createPlayerEliminated: function(playerId) {
        return {
            type: gameevents.PLAYER_ELIMINATED,
            playerId
        };
    },
    createNewBallSpawn: function(nextSpawnInformation) {
        return {
            type: gameevents.NEW_BALL_SPAWN,
            nextSpawnInformation: nextSpawnInformation
        };
    }
};

exports.gameevents = gameevents;
