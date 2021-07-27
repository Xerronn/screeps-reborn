const Construct = require("./construct");

//spawn entity
class Nexus extends Construct {
    constructor(spawnId) {
        super(spawnId);

        //attributes that will not change from tick to tick
        this.name = this.liveObj.name;

        this.update(true);
    }

    update(force=false) {
        if (this.updateTick != Game.time || force == true) {
            if (!super.update(force)) return false;
            this.spawning = this.liveObj.spawning;

            //used to prevent trying to spawn multiple things on one tick
            this.spawningThisTick = false;
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
        if (!memory) {
            memory = {}
        }
        memory["name"] = name;
        memory["type"] = type;
        memory["spawnRoom"] = this.room;
        memory["body"] = body;
        memory["spawning"] = true;
        let success = this.liveObj.spawnCreep(body, name, {memory: memory});

        if (success == OK) {
            let task = "delete Memory.creeps[\"" + name + "\"].spawning; global.Imperator.administrators[\"" + this.room + "\"].originator.initializeCreep(\"" + name + "\");";
            this.spawningThisTick = true;
            global.Archivist.setExtensionsFilled(this.room, false);
            global.Executive.schedule(Game.time + body.length * CREEP_SPAWN_TIME, task);
        }
        return success;
    }
}

module.exports = Nexus;