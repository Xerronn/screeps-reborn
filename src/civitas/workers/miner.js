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

        //calculate when to spawn a new miner
        let distanceToSource = Game.rooms[this.room].find(FIND_MY_SPAWNS)[0].pos.findPathTo(this.source).length;
        let spawnTime = this.body.length * 3;
        this.timeToSpawn = distanceToSource + spawnTime;
        
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
            if (this.memory.link) {
                this.link = Game.getObjectById(this.memory.link);
            } else if (Game.time % 25 == 0) {
                let sourceLink = global.Archivist.getSources(this.room)[this.sourceId].link;
                if (sourceLink) {
                    this.memory.link = sourceLink;
                    this.link = Game.getObjectById(this.memory.link);
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

            //spawn courier
            if (!this.memory.courierSpawned) {
                this.spawnCourier();
            }
        } else {
            if (this.store.getUsedCapacity(RESOURCE_ENERGY) == 0 || (this.memory.task == "withdraw" && this.store.getFreeCapacity(RESOURCE_ENERGY) > this.numWork * 2)) {
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
        if (this.memory.generation !== undefined && this.ticksToLive <= this.timeToSpawn) {
            //basically rebirth but without the dying first
            this.evolve();
            this.getSupervisor().initiate({
                'body': [...this.body],
                'type': this.memory.type,
                'memory': {...this.memory}
            });

            //no more rebirth for you
            delete this.memory.generation;
        }

        //evolve the creep if it has a link
        if (this.ticksToLive < 2 && this.link) {
            this.evolve();
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
     * Method to spawn couriers that take the energy from the container to the storage
     */
     spawnCourier() {
        this.getSupervisor().initiate({
            'body': [CARRY, CARRY, CARRY, MOVE, MOVE, MOVE],
            'type': 'courier',
            'memory': {
                'generation' : 0, 
                'container': this.memory.container,
                'resource': RESOURCE_ENERGY
            }
        });
        
        this.memory.courierSpawned = true;
    }

    /**
     * Method to evolve the body after getting a link
     */
    evolve() {
        if (this.link) {
            this.memory.body = [
                WORK, WORK, WORK, WORK, WORK, WORK, WORK,
                CARRY, CARRY, CARRY, CARRY, CARRY,
                MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE
            ]
        }
    }
}

module.exports = Miner;