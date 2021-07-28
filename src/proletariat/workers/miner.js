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

        //if a source link exists
        let sourceLink = global.Archivist.getSources(this.room)[this.sourceId].link;
        if (sourceLink) {
            this.linkId = sourceLink; 
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

            //keep checking to see if a link exists every 25 seconds
            if (this.linkId) {
                this.link = Game.getObjectById(this.linkId);
            } else if (Game.time % 25 == 0) {
                let sourceLink = global.Archivist.getSources(this.room)[this.sourceId].link;
                if (sourceLink) {
                    this.linkId = sourceLink;
                    this.link = Game.getObjectById(this.linkId);
                }
            }
        }
        return true;
    }

    /**
     * logic run on every tick
     */
    run() {
        if (this.container) {
            this.harvest();
        } else {
            if (this.store.getUsedCapacity(RESOURCE_ENERGY) == 0 || (this.memory.task == "withdraw" && this.store.getFreeCapacity(RESOURCE_ENERGY) > 0)) {
                this.memory.task = "withdraw";
                super.harvest();
            } else {
                this.memory.task = "deposit"
                if (this.link) {
                    this.depositLink();
                } else {
                    //if there is no link, build the link
                    this.build();
                }
            }
        } 
    }

    /**
     * Overriden harvest method that moves to container instead of to source
     */
    //TODO: add automatic container repairing too
    harvest() {
        if (this.pos.inRangeTo(this.container, 0)) {
            this.liveObj.harvest(this.source);
        } else {
            this.liveObj.moveTo(this.container);
        }
    }

    /**
     * Method that empties all stored energy into the source link
     */
    depositLink() {
        if (this.pos.inRangeTo(this.link, 0)) {
            this.liveObj.transfer(this.link, RESOURCE_ENERGY);
        } else {
            this.liveObj.moveTo(this.link);
        }
    }
}

module.exports = Miner;