const Worker = require("./worker");

class Scholar extends Worker {
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

        //evolve the creep to meet expanding stored energy
        if (this.ticksToLive < 2) {
            this.evolve();
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
        if (this.link) {
            //once we have a link, we don't need as many carry parts
            this.memory.body = [
                WORK, WORK, WORK, WORK, 
                CARRY, CARRY,
                MOVE, MOVE, MOVE, MOVE, MOVE, MOVE
            ];
        }

        let roomStorage = Game.rooms[this.room].storage;
        if (roomStorage.store.getUsedCapacity(RESOURCE_ENERGY) > roomStorage.store.getCapacity(RESOURCE_ENERGY) / 3) {
            let totalEnergy = Game.rooms[this.room].energyCapacityAvailable;
            let newBody = this.memory.body;
            //calculate current cost
            let totalCost = 0;
            for (let part of newBody) {
                if (part == WORK) {
                    totalCost += 100;
                } else {
                    totalCost += 50;
                }
            }

            //the energy we have to work with
            totalEnergy -= totalCost;

            while(totalEnergy > 150) {
                newBody.unshift(WORK);
                newBody.push(MOVE);
                totalEnergy -= 150;
            }
            this.memory.body = newBody;
        }
    }
}

module.exports = Scholar;