const { gameconstants } = require('../shared/gameconstants');

// Angle should be specified in degrees
// the rectangles that surround the entire player area are included automatically
// list of rectangles: [x, y, w, h, angle] relative to 0,0 of natural bounds
// ball spawn: x,y
// player spawns: [x,y]

const mapData = [
    {
        name: 'basic',
        walls: [],
        ballSpawn: [350, 350],
        playerSpawns: [
            [200, 100],
            [500, 600],
            [100, 500],
            [600, 200],
            [500, 100],
            [200, 600],
            [100, 200],
            [600, 500],
            [350, 100],
            [350, 600],
            [100, 350],
            [600, 350]
        ]
    },
    {
        name: 'map-demo',
        walls: [
            [0, 0, 50, 50, 45],
            [700, 0, 50, 50, 45],
            [0, 700, 50, 50, 45],
            [700, 700, 50, 50, 45],
            [350, 0, 50, 50, 45],
            [350, 700, 50, 50, 45],
            [0, 350, 50, 50, 45],
            [700, 350, 50, 50, 45]
        ],
        ballSpawn: [350, 350],
        playerSpawns: [
            [200, 100],
            [500, 600],
            [100, 500],
            [600, 200],
            [500, 100],
            [200, 600],
            [100, 200],
            [600, 500],
            [350, 100],
            [350, 600],
            [100, 350],
            [600, 350]
        ]
    }
]

class MapProvider {

    constructor() {
        this.maps = new Map();

        mapData.map(m => convertMapDataToGameFormat(m))
            .forEach(m => this.maps.set(m.name, m));
    }

    getMap(mapName) {
        return this.maps.get(mapName);
    }
}

function convertMapDataToGameFormat(mapData) {
    const mapWalls = mapData.walls
        .filter(w => w.length === 5)
        .map(w => makeRectForWindow(...w));
    const ballSpawn = mapData.ballSpawn.length === 2
        ? makePoint(...mapData.ballSpawn)
        : makePoint(0, 0);
    const playerSpawns = mapData.playerSpawns
        .filter(p => p.length === 2)
        .map(p => makePoint(...p));
    
    return {
        name: mapData.name,
        walls: getBoundingRects().concat(mapWalls),
        ballSpawn: ballSpawn,
        playerSpawns: playerSpawns
    };
}

function getBoundingRects() {
    const thickness = 100;
    const halfThickness = thickness / 2;

    const wallWidth = gameconstants.PLAY_AREA_WIDTH + 2 * thickness;
    const wallHeight = gameconstants.PLAY_AREA_HEIGHT + 2 * thickness;

    const xMiddle = gameconstants.PLAY_AREA_WIDTH / 2;
    const yMiddle = gameconstants.PLAY_AREA_HEIGHT / 2;

    const xRightEdge = gameconstants.PLAY_AREA_WIDTH;
    const yBottomEdge = gameconstants.PLAY_AREA_HEIGHT;

    return [
        makeRectForWindow(xMiddle, -halfThickness, wallWidth, thickness, 0), // top
        makeRectForWindow(-halfThickness, yMiddle, thickness, wallHeight, 0), // left
        makeRectForWindow(xMiddle, yBottomEdge + halfThickness, wallWidth, thickness, 0), // bottom
        makeRectForWindow(xRightEdge + halfThickness, yMiddle, thickness, wallHeight, 0) // right
    ]
}

function toWindowCoordinates(x, y) {
    const xTranslate = gameconstants.WINDOW_WIDTH / 2 - gameconstants.PLAY_AREA_WIDTH / 2;
    const yTranslate = gameconstants.WINDOW_HEIGHT / 2 - gameconstants.PLAY_AREA_HEIGHT / 2;

    return [x + xTranslate, y + yTranslate];
}

function makeRectForWindow(x, y, w, h, angle) {
    const [ windowX, windowY ] = toWindowCoordinates(x, y);
    return {
        x: windowX,
        y: windowY,
        w,
        h,
        angle
    };
}

function makePoint(x, y) {
    const [ windowX, windowY ] = toWindowCoordinates(x, y);
    return {
        x: windowX,
        y: windowY,
    };
}

exports.MapProvider = MapProvider;
