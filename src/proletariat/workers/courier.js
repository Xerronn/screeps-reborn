const Miner = require("./miner");

//creep tasked with transporting energy from miners to storage
class Courier extends Miner {
    constructor(creepId) {
        super(creepId);

        //! TODO: what if the storage is killed
        this.storageId = Game.rooms[this.room].storage.id;

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
}

module.exports = Courier;