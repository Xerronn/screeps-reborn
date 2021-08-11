const Worker = require("./worker");

class Scholar extends Worker {
    constructor(creepId) {
        super(creepId);

        //attributes that will not change tick to tick
        this.controllerId = Game.rooms[this.room].controller.id;
        this.linkId = this.getSupervisor().controllerLink.id;

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
            this.link = Game.getObjectById(this.linkId);
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
                MOVE, MOVE, MOVE, MOVE, MOVE, MOVE
            ];
        }

        let roomStorage = Game.rooms[this.room].storage;
        if (roomStorage.store.getUsedCapacity(RESOURCE_ENERGY) > roomStorage.store.getCapacity(RESOURCE_ENERGY) / 3) {
            //total energy minus the two carry parts
            let totalEnergy = Game.rooms[this.room].energyCapacityAvailable - 100;
            let newBody = [CARRY, CARRY, MOVE];
            let roadsBuilt = global.Archivist.getRoadsBuilt(this.room);
            let maxCount = 48;
            if (roadsBuilt) {
                maxCount = 33;
            } else {
                newBody.push(MOVE);
            }
            

            let index = 0;
            while(totalEnergy >= 150 && newBody.length < maxCount) {
                newBody.unshift(WORK);

                if ((roadsBuilt && index % 2 != 0) || !roadsBuilt) {
                    newBody.push(MOVE);
                }
            }

            this.memory.body = newBody;
        }
    }
}

module.exports = Scholar;