//Entity for managing memory
class Archivist {
    constructor() {
        //! set to true for development only!
        this.build();
    }

    /**
     * Function that build the memory object from scratch
     * @param {boolean} reset reset the memory
     */
    build(reset = false) {
        if (!Memory.rooms || reset) {
            Memory.rooms = {};

            for (var room of global.Imperator.dominion) {
                Memory.rooms[room] = {};

                //first chunk of code from the old source material
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
}

module.exports = Archivist;