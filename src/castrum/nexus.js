const Castrum = require("./castrum");

//spawn entity
class Nexus extends Castrum {
    constructor(spawnId) {
        super(spawnId);

        //attributes that will not change from tick to tick
        this.name = this.liveObj.name;
        this.reserved = false;
        this.reservedCount = 0;

        this.update(true);
    }

    update(force=false) {
        if (this.updateTick != Game.time || force == true) {
            if (!super.update(force)) return false;
            this.spawning = this.liveObj.spawning;

            //used to prevent trying to spawn multiple things on one tick
            this.spawningThisTick = false;

            //used to prevent nexus spawning in case of renewal
            if (this.reserved) {
                if (this.reservedCount == 0) {
                    this.reserved = false;
                } else {
                    this.reservedCount--;
                }
            }
        }
        return true;
    }

    run() {
        if (this.store.getFreeCapacity(RESOURCE_ENERGY) > 0) {
            global.Archivist.setExtensionsFilled(this.room, false);
        }
        return;
    }

    /**
     * A function to spawn a creep in a room
     * @param {Array} body Array of body constants that the creep will be spawned with
     * @param {String} type The type of creep to be spawned
     * @param {Object} memory an optional memory object to spawn the creep with. Recommended only for rebirth. Do other memory stuff in objects
     * @returns 
     */
    spawnCreep(body, type, memory=undefined) {
        let name = type + "<" + Game.time + ">"

        let spawnBody = body;
        //reduce move parts when roads are built
        if (global.Archivist.getRoadsBuilt(this.room) && !memory.noRoads) {
            //build a list of all non move body parts
            let noMoves = [];
            for (let part of spawnBody) {
                if (part != MOVE) {
                    if (part == WORK) {
                        noMoves.unshift(part);
                    } else noMoves.push(part);
                }
            }

            //if noMoves is empty, body was entirely moves
            if (noMoves.length > 0) {
                //add moves onto that list until moves are equal to half the non moves
                let targetMoves = Math.ceil(noMoves.length / 2);
                for (let i = 0; i < targetMoves; i++) {
                    noMoves.push(MOVE);
                }
                spawnBody = noMoves;
            }
        }

        if (!memory) {
            memory = {}
        }
        memory["name"] = name;
        memory["type"] = type;
        memory["spawnRoom"] = this.room;
        memory["body"] = spawnBody;
        memory["spawning"] = true;
        let success = this.liveObj.spawnCreep(spawnBody, name, {memory: memory});

        if (success == OK) {
            let task = "delete Memory.creeps[\"" + name + "\"].spawning; global.Imperator.administrators[\"" + this.room + "\"].supervisor.wrapCreep(\"" + name + "\");";
            this.spawningThisTick = true;
            global.Archivist.setExtensionsFilled(this.room, false);
            global.TaskMaster.schedule(Game.time + spawnBody.length * CREEP_SPAWN_TIME, task);
        }
        return success;
    }

    /**
     * Method to block spawning for three ticks
     */
    reserve() {
        this.reserved = true;
        this.reservedCount = 3;
    }
}

module.exports = Nexus;