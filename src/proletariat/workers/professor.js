const Worker = require("./worker");

class Professor extends Worker {
    constructor(creepId) {
        super(creepId);

        //attributes that will not change tick to tick
        this.controllerId = Game.rooms[this.room].controller.id;

        update(true);
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
        let freeCapacity = this.store.getFreeCapacity(RESOURCE_ENERGY);
        if (freeCapacity > 0) {
            this.withdrawStorage();
        } else {
            this.upgradeController();
        }
    }
    //todo link upgrading
}

module.exports = Professor;