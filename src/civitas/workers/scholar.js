const Worker = require("./worker");

class Scholar extends Worker {
    constructor(creepId) {
        super(creepId);

        //attributes that will not change tick to tick
        this.controllerId = Game.rooms[this.room].controller.id;
        if (this.getSupervisor().controllerLink) {
            this.linkId = this.getSupervisor().controllerLink.id;
        }

        this.update(true);
    }

    /**
     * Update live game object references each tick
     */
     update(force) {
        if (this.updateTick != Game.time || force == true) {
            if (!super.update(force)) {
                //creep is dead
                return false;
            }
            //attributes that will change tick to tick
            this.controller = Game.getObjectById(this.controllerId);
            if (this.linkId) this.link = Game.getObjectById(this.linkId);
        }
        return true;
    }

    /**
     * logic to run each tick
     */
    run() {
        if (this.store.getUsedCapacity(RESOURCE_ENERGY) < this.numWork || (this.memory.task == "withdraw" && this.store.getFreeCapacity(RESOURCE_ENERGY) > 0)) {
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
                MOVE, MOVE, MOVE
            ];
        } else {
            this.memory.body = [
                WORK, WORK, WORK, WORK,
                CARRY, CARRY, CARRY, CARRY,
                MOVE, MOVE, MOVE, MOVE
            ]
        }
         
        let newBody = this.memory.body;
        let roomStorage = Game.rooms[this.room].storage;
        if (roomStorage.store.getUsedCapacity(RESOURCE_ENERGY) > roomStorage.store.getCapacity(RESOURCE_ENERGY) / 3) {
            let currentBodyCost = global.Illustrator.calculateBodyCost(newBody);
            let totalEnergy = Game.rooms[this.room].energyCapacityAvailable - currentBodyCost;
            //scholars spawn after roads built is set to true
            let index = 0;
            let numWork = 4;
            while(true) {
                if (totalEnergy >= 100 && numWork < 30) {
                    newBody.unshift(WORK);
                    totalEnergy -= 100;
                    numWork++;
                } else break;

                if (totalEnergy >= 50) {
                    if (index % 2 != 0) {
                        newBody.push(MOVE);
                        totalEnergy -= 50;
                    }
                } else break;

                index++;
            }
            this.memory.body = newBody;
        }
    }
}

module.exports = Scholar;