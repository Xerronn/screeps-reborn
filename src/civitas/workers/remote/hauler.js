const Remotus = require("./remotus");

//class declaration for a remote room hauler creep
//source and container must be passed by prospector
//! TODO: cache path and also pickup dropped energy on roads
class Hauler extends Remotus {
    constructor(creepId) {
        super(creepId);
        
        this.update(true);
    }

    update(force=false) {
        if (this.updateTick != Game.time || force == true) {
            if (!super.update(force)) {
                //creep is dead
                return false;
            }

            this.storage = Game.rooms[this.memory.spawnRoom].storage;

            //attributes that change tick to tick
            if (this.memory.source) {
                this.source = Game.getObjectById(this.memory.source);
            }
            if (this.memory.container) {
                this.container = Game.getObjectById(this.memory.container);
            }
        }
        return true;
    }

    run() {
        if (!this.arrived) {
            this.march();
            return;
        }

        if (this.store.getUsedCapacity(RESOURCE_ENERGY) == 0 || (this.memory.task == "withdraw" && this.store.getFreeCapacity(RESOURCE_ENERGY) > 0)) {
            this.memory.task = "withdraw";
            this.withdrawContainer();
        } else {
            this.memory.task = "deposit"
            this.depositStorage();
        }
    }

    /**
     * Function to withdraw energy from the container
     */
    withdrawContainer() {
        if (this.container) {
            if (this.pos.inRangeTo(this.container, 1)) {
                if (this.container.store.getUsedCapacity(RESOURCE_ENERGY) > this.store.getFreeCapacity(RESOURCE_ENERGY)) {
                    this.liveObj.withdraw(this.container, RESOURCE_ENERGY);
                }
            } else {
                this.liveObj.moveTo(this.container);
            }
        } else {
            //wait until new container is built, then assign it again
            if (Game.rooms[this.room].find(FIND_MY_CONSTRUCTION_SITES).length == 0) {
                this.container = this.source.pos.findInRange(allContainers, 1)[0].id;
                if (this.container) {
                    this.memory.container = this.container.id;
                }
            }
            if (!this.pos.inRangeTo(this.source, 2)) {
                this.liveObj.moveTo(this.source);
            }
        }
    }

    /**
     * Move to storage and deposit all stored energy
     */
     depositStorage() {
        if (this.pos.inRangeTo(this.storage, 1)) {
            this.liveObj.transfer(this.storage, RESOURCE_ENERGY);
        } else {
            this.liveObj.moveTo(this.storage);
        }
    }
}

module.exports = Hauler;