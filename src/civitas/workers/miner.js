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
            let container = this.source.pos.findInRange(allContainers, 1)[0];

            if (container) {
                this.containerId = container.id;
                this.memory.container = container.id;
            }
        }

        //if a source link exists
        let sourceLink = global.Archivist.getSources(this.room)[this.sourceId].link;
        if (sourceLink) {
            this.linkId = sourceLink; 
        }

        //calculate when to spawn a new miner
        let distanceToSource = Game.rooms[this.room].find(FIND_MY_SPAWNS)[0].pos.findPathTo(this.source).length;
        let spawnTime = this.body.length * 3;
        this.timeToSpawn = distanceToSource + spawnTime;
        this.replaced = false;
        
        this.update(true);
    }

    update(force=false) {
        if (this.updateTick != Game.time || force == true) {
            if (!super.update(force)) {
                //creep is dead
                return false;
            }
            //attributes that will change tick to tick
            this.container = Game.getObjectById(this.containerId);

            //keep checking to see if a link exists every 25 ticks
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

        //make sure to spawn new miner before the current one dies, to maintain 100% uptime
        if (!this.replaced && this.ticksToLive <= this.timeToSpawn) {
            //basically rebirth but without the dying first
            this.getSupervisor().initiate({
                'body': [...this.body],
                'type': this.memory.type,
                'memory': {...this.memory}
            });

            //no more rebirth for you
            delete this.memory.generation;
            this.replaced = true;
        }
    }

    /**
     * Overridden harvest method that moves to container instead of to source
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
        if (this.pos.inRangeTo(this.link, 1)) {
            this.liveObj.transfer(this.link, RESOURCE_ENERGY);
        } else {
            this.liveObj.moveTo(this.link);
        }
    }

    /**
     * Method to spawn the successor creep that will arrive 
     * at the source right when the current miner dies
     */
    spawnSuccessor() {

    }
}

module.exports = Miner;