const Miner = require("./miner");

//creep tasked with transporting energy from miners to storage
class Courier extends Miner {
    constructor(creepId) {
        super(creepId);

        //! TODO: what if the storage is killed
        this.storageId = Game.rooms[this.room].storage.id;
        this.evolved = false;

        this.update(true);
    }

    /**
     * Update live game object references each tick
     */
    update(force) {
        if (this.updateTick != Game.time || force == true) {
            if (!super.update(force)) {
                //creep is dead
            }
            //attributes that will change tick to tick
            this.storage = Game.getObjectById(this.storageId);
        }
        return true;
    }

    /**
     * logic to run each tick
     */
    run() {
        //if container no longer exists, its been replaced by a link
        if (!this.container) {
            //disable rebirth
            delete this.memory.generation;
            //rip
            this.liveObj.suicide();
            return;
        }
        
        //evolve if the container ever gets full. it means the transporter is underpowered
        if (this.container.store.getFreeCapacity(RESOURCE_ENERGY) == 0 && this.evolved == false) {
            this.evolve();
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
     * Move to assigned container and withdraw if the container can fill the creep
     */
    withdrawContainer() {
        if (this.pos.inRangeTo(this.container, 1)) {
            if (this.container.store.getUsedCapacity(RESOURCE_ENERGY) > this.store.getFreeCapacity(RESOURCE_ENERGY)) {
                this.liveObj.withdraw(this.container, RESOURCE_ENERGY);
            }
        } else {
            this.liveObj.moveTo(this.container);
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

    /**
     * Method to evolve creep if its base body isn't enough to keep up
     */
    evolve() {
        //add one of each
        //only if < 800 in case it fills up while transporter is dead
        if (this.ticksToLive < 800) {
            //miners mine 12 energy per tick, and you have to travel both ways
            let travelLength = this.storage.pos.findPathTo(this.container).length * 12 * 2;
            let carryCount = Math.ceil(travelLength / 50);

            let newBody = [];
            for (let i = 0; i < carryCount; i++) {
                newBody.push(MOVE);
                newBody.unshift(CARRY);
            }
            this.evolved = true;
            this.memory.body = newBody;
        }
    }
}

module.exports = Courier;