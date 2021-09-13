/**
 * WIP method to build ramparts in a room
 */
function buildRamparts(room) {
    let liveRoom = Game.rooms[room]
    let anchor = global.Archivist.getAnchor(room);
    let center = new RoomPosition(anchor.x + 5, anchor.y + 5, room);

    //first flee from storage to any of the exits
    let roomExits = Object.keys(Game.map.describeExits(room)).map(x => parseInt(x));
    let lines = [];
    for (let direction of roomExits) {
        let allExits = liveRoom.find(direction);
        let goals = [];
        for (let exit of allExits) {
            goals.push({
                    pos: exit,
                    range : 2
            });
        }
        //keep searching towards this exit until the path is incomplete
        while(true) {
            //path find to the current exit
            let pathToExit = PathFinder.search(
                center,
                goals, 
                {
                    plainCost: 0,
                    swampCost: 0,
                    roomCallback: buildCostMatrix,
                    maxRooms: 1,
                    maxCost: 255
                }
            );

            let currentMatrix = buildCostMatrix(room);

            //if the path is impossible, we are done with the wall building
            if (pathToExit.incomplete) break;
            let candidate = {
                line: undefined,
                score: 0
            }

            //determine which way the path is heading
            for (let i = 6; i < pathToExit.path.length; i++) {
                let pos = pathToExit.path[i];
                let line = [];
                line.push(pos); //log start pos
                new RoomVisual(room).circle(pos.x, pos.y, {fill: 'blue', radius: 0.25});
                let nextDirection = pathToExit.path[i - 1].getDirectionTo(pos);

                let orientation;
                if (direction == TOP || direction == BOTTOM) {
                    if ([TOP, BOTTOM, TOP_LEFT, TOP_RIGHT, BOTTOM_LEFT, BOTTOM_RIGHT].includes(nextDirection)) {
                        orientation = 'horizontal';
                    } else {
                        orientation = 'vertical';
                    }
                    
                } else if (direction == TOP || direction == BOTTOM) {
                    if ([LEFT, RIGHT, TOP_LEFT, TOP_RIGHT, BOTTOM_LEFT, BOTTOM_RIGHT].includes(nextDirection)) {
                        orientation = 'vertical';
                    } else {
                        orientation = 'horizontal';
                    }
                }

                if (orientation === 'horizontal') {
                    //move left until we hit a wall
                    for (let x = pos.x - 1; x > 1; x--) {
                        line.push(liveRoom.getPositionAt(x, pos.y));
                        let costValues = [];
                        for (let i = -1; i < 2; i++) {
                            costValues.push(currentMatrix.get(x, pos.y + i))
                        }
                        if (costValues.includes(0xff)) {
                            //tile is a wall, move to next step
                            break;
                        }
                    }

                    //now move right until we hit a wall
                    for (let x = pos.x + 1; x < 48; x++) {
                        line.push(liveRoom.getPositionAt(x, pos.y));
                        let costValues = [];
                        for (let i = -1; i < 2; i++) {
                            costValues.push(currentMatrix.get(x, pos.y + i))
                        }
                        if (costValues.includes(0xff)) {
                            //tile is a wall, move to next step
                            break;
                        }
                    }
                } else if (orientation === 'vertical') {
                    for (let y = pos.y - 1; y > 1; y--) {
                        line.push(liveRoom.getPositionAt(pos.x, y));
                        let costValues = [];
                        for (let i = -1; i < 2; i++) {
                            costValues.push(currentMatrix.get(pos.x + i, y))
                        }
                        if (costValues.includes(0xff)) {
                            //tile is a wall, move to next step
                            break;
                        }
                    }

                    //now move down until we hit a wall
                    for (let y = pos.y + 1; y < 48; y++) {
                        line.push(liveRoom.getPositionAt(pos.x, y));
                        let costValues = [];
                        for (let i = -1; i < 2; i++) {
                            costValues.push(currentMatrix.get(pos.x + i, y))
                        }
                        if (costValues.includes(0xff)) {
                            //tile is a wall, move to next step
                            break;
                        }
                    }
                }
                
                let score = i * Math.pow(line.length, 5);
                //if the currently calculated line is better, store it
                //lower score is better
                if (!candidate.line || candidate.score > score) {
                    candidate.line = line;
                    candidate.score = score;
                }

            }
            for (let pos of candidate.line) {
                new RoomVisual(room).circle(pos.x, pos.y, {fill: 'red', radius: 0.5});
            }
            lines.push(candidate.line);
        }
    }

    function buildCostMatrix(room) {
        let matrix = new PathFinder.CostMatrix;
        let roomTerrain = Game.rooms[room].getTerrain();
        for (let x = 0; x < 50; x++) {
            for (let y = 0; y < 50; y++) {
                //set previously built walls as impassible
                for (let line of lines) {
                    for (let pos of line) {
                        if (pos.x == x && pos.y == y) {
                            matrix.set(x, y, 0xff);
                        }
                    }
                }

                if (roomTerrain.get(x, y) === 1) {
                    matrix.set(x, y, 0xff);
                }
            }
        }

        return matrix;
    }
}