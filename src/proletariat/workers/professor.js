const Worker = require("./worker");

class Professor extends Worker {
    constructor(creepId) {
        super(creepId);

        //attributes that will not change tick to tick
        this.controllerId = Game.rooms[this.room].controller.id;
        this.linkId = global.Imperator.administrators[this.room].supervisor.controllerLink.id;

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
            this.link = Game.getObjectById(this.linkId);
        }
        return true;
    }

    /**
     * logic to run each tick
     */
    run() {
        if (this.store.getUsedCapacity(RESOURCE_ENERGY) == 0 || (this.memory.task == "withdraw" && this.store.getFreeCapacity(RESOURCE_ENERGY) > 0)) {
            this.memory.task = "withdraw";
            if (!this.link) {
                this.withdrawStorage();
            } else this.withdrawLink();
        } else {
            this.memory.task = "upgrade";
            this.upgradeController();
        }
    }
    
    /**
     * Method to withdraw from link
     */
    withdrawLink() {
        if (this.link.store.getUsedCapacity(RESOURCE_ENERGY) > this.store.getCapacity(RESOURCE_ENERGY)) {
            if (this.pos.inRangeTo(this.link, 1)) {
                this.liveObj.withdraw(this.link, RESOURCE_ENERGY);
            } else {
                this.liveObj.moveTo(this.link);
            }
        }
    }

    /**
     * Method to evolve the upgrader depending on storage levels and link
     */
    evolve() {

    }
}

module.exports = Professor;