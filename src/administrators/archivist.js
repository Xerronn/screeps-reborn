//Entity for managing memory
class Archivist {
    constructor() {
    }

    /**
     * Function that builds the memory object from scratch
     * @param {boolean} reset reset the memory
     */
    build(reset = false) {
        if (!Memory.rooms || reset) {
            Memory.rooms = {};
        }

        for (var room of global.Imperator.dominion) {
            if (!Memory.rooms[room]) {
                Memory.rooms[room] = {};
            }

            if (!Memory.rooms[room].sources) {
                //first chunk of code from the old source material
                //get all sources and init a list to track workers
                Memory.rooms[room].sources = {};
                let sources = Game.rooms[room].find(FIND_SOURCES).map(source => source.id);
                for (let source of sources) {
                    Memory.rooms[room].sources[source] = {};
                    Memory.rooms[room].sources[source].harvesters = [];
                    // Memory.rooms[room].sources[source].workers = [];
                    // Memory.rooms[room].sources[source].transporters = [];
                }
            }
        }
    }

    /**
     * Refresh all structures cache
     */
    refresh() {
        for (let room of global.Imperator.dominion) {
            Memory.rooms[room].structures = {};

            Memory.rooms[room].structures.extensions = [];

            let extensions = Game.rooms[room].find(FIND_STRUCTURES, {
                filter: (structure) => [STRUCTURE_EXTENSION, STRUCTURE_SPAWN].includes(structure.structureType)
            });
            
            extensions.forEach(ext => Memory.rooms[room].structures.extensions.push(ext.id));
            
        }

        //do it again in 100 ticks
        let task = "global.Archivist.refresh()";
        global.Executive.schedule(Game.time + 100, task);
    }
}

module.exports = Archivist;