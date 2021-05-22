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
        }
        return true;
    }

    run() {
        return;
    }

    spawnCreep(body, type, memory=null) {
        //todo: make an object for the newly spawned creep
        let name = type + " <" + Game.time + ">"
        if (!memory) {
            memory = {
                "type": type
            }
        }
        return this.liveObj.spawnCreep(body, name, {memory: memory})
    }
}

module.exports = Nexus;