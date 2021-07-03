//Entity for managing memory
class Archivist {
    constructor() {
    }

    /**
     * Function that builds the memory object at the beginning and after global resets
     * @param {boolean} reset reset the memory
     */
    build(reset = false) {
        if (!Memory.rooms || reset) {
            Memory.rooms = {};
        }

        if (!Memory.gFlags || reset) {
            Memory.gFlags = {};
            Memory.gFlags.memoryInit = false;
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

            if (!Memory.rooms[room].flags) {
                Memory.rooms[room].flags = {}
                Memory.rooms[room].flags.extensionsFilled = false;
            }
        }

        //This must be at the end of this method
        //it should only ever happen once, on the first build of the archivist
        //it will auto renew as per defined in the refresh method using the executive
        if (!Memory.gFlags.memoryInit) {
            this.refresh();
            Memory.gFlags.memoryInit = true;
        }
    }

    /**
     * Refresh all structures cache
     */
    refresh() {
        //todo: make this automatically happen only once
        for (let room of global.Imperator.dominion) {
            Memory.rooms[room].structures = {};

            Memory.rooms[room].structures.extensions = [];

            let extensions = Game.rooms[room].find(FIND_STRUCTURES, {
                filter: (structure) => [STRUCTURE_EXTENSION, STRUCTURE_SPAWN].includes(structure.structureType)
            });
            
            extensions.forEach(ext => Memory.rooms[room].structures.extensions.push(ext.id));
            
        }

        //do it again in 100 ticks
        //! make sure this gets executed only once. Use gflags
        let task = "global.Archivist.refresh()";
        global.Executive.schedule(Game.time + 100, task);
    }

    /**
     * Set extensions filled flag for a given room
     * @param {String} room string representing the room
     * @param {Boolean} value value to set the flag
     */
    setExtensionsFilled(room, value) {
        Memory.rooms[room].flags.extensionsFilled = value;
    }

    /**
     * Get extensions filled flag for a given room
     * @param {String} room string representing the room
     */
     getExtensionsFilled(room) {
        return Memory.rooms[room].flags.extensionsFilled;
    }
}

module.exports = Archivist;