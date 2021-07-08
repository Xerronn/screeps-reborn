//Entity for managing memory
class Archivist {
    constructor() {
    }

    /**
     * Function that builds the memory object at the beginning and after global resets
     * @param {boolean} reset reset the memory
     */
    build(reset = false) {
        if (!Memory.creeps || reset) {
            Memory.creeps = {};
        }

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

            if (!Memory.rooms[room].flags) {
                Memory.rooms[room].flags = {}
                Memory.rooms[room].flags.extensionsFilled = false;
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
            let sortedStructures = {};
            let allStructures = Game.rooms[room].find(FIND_STRUCTURES);

            //sort all the structures into an object so we can easily add them to memory
            //eliminates filtering the structures for each type
            for (let struc of allStructures) {
                if (!(struc.structureType in sortedStructures)) {
                    sortedStructures[struc.structureType] = [];
                }
                sortedStructures[struc.structureType].push(struc);
            }

            //construction sites
            let constructionSites = Game.rooms[room].find(FIND_MY_CONSTRUCTION_SITES);
            Memory.rooms[room].structures.constructionSites = [];
            constructionSites.forEach(site => Memory.rooms[room].structures.constructionSites.push(site.id));
            
            //all other stored structures
            for (let strucType in sortedStructures) {
                //create the empty memory
                eval("Memory.rooms[room].structures." + strucType + "s = []");

                //add all the structure id's to memory
                let call = "sortedStructures[\"" + strucType + "\"].forEach(obj => Memory.rooms[room].structures." + strucType + "s.push(obj.id))";
                eval(call);
            }
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
     * @returns value of the extensionsfilled flag
     */
     getExtensionsFilled(room) {
        return Memory.rooms[room].flags.extensionsFilled;
    }

    /**
     * Get all instances of a certain structure within a room
     * @param {String} room string representing the room
     * @param {String} structure type of structure to get
     * @returns an array of live game objects
     */
    getStructures(room, structure) {
        let call = "Memory.rooms[room].structures." + structure + ".map(obj => Game.getObjectById(obj))";
        return eval(call);
    }
}

module.exports = Archivist;