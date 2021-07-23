const Worker = require("./worker");

//creep tasked with harvesting sources
class Miner extends Worker {
    constructor(creepId) {
        super(creepId);

        //attributes that won't change tick to tick
        if (this.memory.container) {
            //for creep rebirth and object init
            this.containerId = this.memory.container;
        } else {
            let allContainers = global.Archivist.getStructures(this.room, STRUCTURE_CONTAINER);
            let container = this.source.pos.findClosestByRange(allContainers);

            this.containerId = container.id;
            this.memory.container = container.id;
        }
        
        this.update(true);
    }

    update(force=false) {
        if (this.updateTick != Game.time || force == true) {
            if (!super.update(force)) {
                //creep is dead
            }
            //attributes that will change tick to tick
            this.container = Game.getObjectById(this.containerId);
        }
        return true;
    }

    /**
     * logic run on every tick
     */
    run() {
        //move to container
        this.harvest();
    }

    /**
     * Overriden harvest method that moves to container instead of to source
     */
    harvest() {
        if (this.pos.inRangeTo(this.container, 0)) {
            this.liveObj.harvest(this.source);
        } else {
            this.liveObj.moveTo(this.container);
        }
    }
}

module.exports = Miner;