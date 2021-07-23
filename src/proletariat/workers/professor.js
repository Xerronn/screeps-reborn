const Worker = require("./worker");

class Professor extends Worker {
    constructor(creepId) {
        super(creepId);

        //attributes that will not change tick to tick
        this.controllerId = Game.rooms[this.room].controller.id;

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
            this.controller = Game.getObjectById(this.controllerId);
        }
        return true;
    }

    /**
     * logic to run each tick
     */
    run() {
        if (this.store.getUsedCapacity(RESOURCE_ENERGY) == 0 || (this.memory.task == "withdraw" && this.store.getFreeCapacity(RESOURCE_ENERGY) > 0)) {
            this.memory.task = "withdraw";
            this.withdrawStorage();
        } else {
            this.memory.task = "upgrade";
            this.upgradeController();
        }
    }
    //todo link upgrading
}

module.exports = Professor;