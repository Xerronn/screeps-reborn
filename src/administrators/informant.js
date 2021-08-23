//class that provides useful misc functions
class Informant {
    constructor() {

    }

    /**
     * Bunker schema adopted from HallowNest 2.0
     * @returns bunker Schema Object
     */
     getBunkerSchema() {
        return {
            "road":{"pos":[{"x":0,"y":0},{"x":1,"y":1},{"x":2,"y":2},{"x":3,"y":3},
                {"x":4,"y":4},{"x":5,"y":5},{"x":6,"y":6},{"x":7,"y":7},{"x":8,"y":8},
                {"x":9,"y":9},{"x":10,"y":10},{"x":10,"y":0},{"x":9,"y":1},{"x":8,"y":2},
                {"x":7,"y":3},{"x":6,"y":4},{"x":4,"y":6},{"x":3,"y":7},{"x":2,"y":8},
                {"x":1,"y":9},{"x":0,"y":10},{"x":5,"y":0},{"x":4,"y":1},{"x":3,"y":2},
                {"x":2,"y":3},{"x":1,"y":4},{"x":0,"y":5},{"x":1,"y":6},{"x":2,"y":7},
                {"x":3,"y":8},{"x":4,"y":9},{"x":5,"y":10},{"x":6,"y":9},{"x":9,"y":6},
                {"x":10,"y":5},{"x":6,"y":1},{"x":7,"y":2},{"x":8,"y":3},{"x":9,"y":4}]},
            "tower":{"pos":[{"x":4,"y":5},{"x":3,"y":5},{"x":3,"y":6},{"x":6,"y":5},
                {"x":7,"y":5},{"x":7,"y":4}]},
            "spawn":{"pos":[{"x":4,"y":3},{"x":7,"y":6},{"x":4,"y":7}]},
            "storage":{"pos":[{"x":5,"y":4}]},
            "link":{"pos":[{"x":5,"y":2}]},
            "observer":{"pos":[{"x":5,"y":1}]},
            "powerSpawn":{"pos":[{"x":4,"y":2}]},
            "factory":{"pos":[{"x":6,"y":2}]},
            "terminal":{"pos":[{"x":6,"y":3}]},
            "lab":{"pos":[{"x":8,"y":7},{"x":7,"y":8},{"x":9,"y":7},{"x":7,"y":9},
                {"x":9,"y":8},{"x":8,"y":9},{"x":10,"y":8},{"x":8,"y":10},
                {"x":10,"y":9},{"x":9,"y":10}]},
            "nuker":{"pos":[{"x":3,"y":4}]},
            "extension":{"pos":[{"x":1,"y":0},{"x":2,"y":0},{"x":3,"y":0},{"x":4,"y":0},
                {"x":3,"y":1},{"x":2,"y":1},{"x":7,"y":0},{"x":8,"y":0},{"x":9,"y":0},
                {"x":6,"y":0},{"x":7,"y":1},{"x":8,"y":1},{"x":10,"y":4},{"x":10,"y":3},
                {"x":10,"y":1},{"x":10,"y":2},{"x":9,"y":2},{"x":9,"y":3},{"x":8,"y":4},
                {"x":8,"y":5},{"x":9,"y":5},{"x":8,"y":6},{"x":10,"y":6},{"x":10,"y":7},
                {"x":6,"y":10},{"x":7,"y":10},{"x":5,"y":9},{"x":4,"y":8},{"x":5,"y":8},
                {"x":6,"y":8},{"x":6,"y":7},{"x":5,"y":7},{"x":5,"y":6},{"x":1,"y":10},
                {"x":2,"y":10},{"x":4,"y":10},{"x":3,"y":10},{"x":3,"y":9},{"x":2,"y":9},
                {"x":0,"y":9},{"x":0,"y":8},{"x":1,"y":8},{"x":1,"y":7},{"x":0,"y":7},
                {"x":0,"y":6},{"x":2,"y":4},{"x":2,"y":6},{"x":2,"y":5},{"x":1,"y":5},
                {"x":0,"y":4},{"x":0,"y":3},{"x":1,"y":3},{"x":1,"y":2},{"x":0,"y":2},
                {"x":0,"y":1}]}
            };
    }

    /**
     * Method that visualizes bunker position with a white square
     * @param {String} room string representing the room
     */
    drawBunker(room) {
        try {
        let roomAnchor = global.Archivist.getAnchor(room);
        Game.rooms[room].visual.rect(roomAnchor.x, roomAnchor.y, 10, 10, {opacity: 0.7});
        return true;
        } catch (err) {
            return "No room Anchor set for room";
        }
    }

    /**
     * Method that takes a structure type constant and returns the name of its wrapper class
     * @param {String} structureType structure type constant
     * @returns class that wraps provided structureType
     */
    mapGameToClass(structureType) {
        //todo: add them here as needed
        let mapper = {
            [STRUCTURE_SPAWN] : "nexus",
            [STRUCTURE_TOWER] : "bastion",
            [STRUCTURE_LINK] : "conduit"
        }
        try {
            return mapper[structureType];
        } catch (err) {
            return undefined;
        }

    }

    /**
     * Method that takes a body array and returns the energy cost
     * @param {Array} body A body parts array
     * @returns the energy cost of a body
     */
    calculateBodyCost(body) {
        let cost = 0;
        for (let part of body) {
            cost += BODYPART_COST[part];
        }

        return cost;
    }

    /**
     * Method that returns the strcutre matrix of a room
     * @param {String} roomName 
     * @returns a roomcache
     */
    getCostMatrix(roomName) {
        //! TODO: figure out why the cacheing isnt working
        //if (this.matrixCache[roomName]) return this.matrixCache[roomName];
        let room = Game.rooms[roomName];
        let matrix = new PathFinder.CostMatrix();

        let impassibleStructures = [];
        for (let structure of room.find(FIND_STRUCTURES)) {
            if (structure instanceof StructureRampart) {
                if (!structure.my && !structure.isPublic) {
                    impassibleStructures.push(structure);
                }
            }
            else if (structure instanceof StructureRoad) {
                matrix.set(structure.pos.x, structure.pos.y, 1);
            }
            else if (structure instanceof StructureContainer) {
                matrix.set(structure.pos.x, structure.pos.y, 5);
            }
            else {
                impassibleStructures.push(structure);
            }
        }
        for (let site of room.find(FIND_MY_CONSTRUCTION_SITES)) {
            if (site.structureType === STRUCTURE_CONTAINER || site.structureType === STRUCTURE_ROAD
                || site.structureType === STRUCTURE_RAMPART) {
                continue;
            }
            matrix.set(site.pos.x, site.pos.y, 0xff);
        }
        for (let structure of impassibleStructures) {
            matrix.set(structure.pos.x, structure.pos.y, 0xff);
        }
        //this.matrixCache[roomName] = matrix;
        return matrix;
    }
}

module.exports = Informant;