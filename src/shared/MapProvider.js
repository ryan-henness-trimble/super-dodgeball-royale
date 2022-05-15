const { gameconstants } = require('../shared/gameconstants');

const allMaps = [
    {
        name: 'basic',
        walls: getBoundingRects(),
        ballSpawn: makePoint(350, 350),
        playerSpawns: [
            makePoint(200, 100),
            makePoint(500, 600),
            makePoint(100, 500),
            makePoint(600, 200),

            makePoint(500, 100),
            makePoint(200, 600),
            makePoint(100, 200),
            makePoint(600, 500),

            makePoint(350, 100),
            makePoint(350, 600),
            makePoint(100, 350),
            makePoint(600, 350)
        ]
    }
];

class MapProvider {

    constructor() {
        this.maps = new Map();

        allMaps.forEach(m => this.maps.set(m.name, m));
    }

    getMap(mapName) {
        return this.maps.get(mapName);
    }
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
