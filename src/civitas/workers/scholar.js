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
        //default body
        let newBody = [
            WORK, WORK, WORK, WORK,
            CARRY, CARRY, CARRY, CARRY,
            MOVE, MOVE, MOVE, MOVE
        ]
        if (this.link) {
            //remove some move parts, as the carry parts weight nothing and the creep never moves when full after getting link
            newBody = [
                WORK, WORK, WORK, WORK,
                CARRY, CARRY, CARRY, CARRY,
                MOVE, MOVE,
            ]
        }
        if (this.controller.level == 8) {
            //at RCL, upgrading energy is capped at 15 work parts per tick.
            this.memory.body = [
                WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK,
                CARRY, CARRY, CARRY, CARRY,
                MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE
            ]
            return;
        }
        //disable automatic move adding
        this.memory.noRoads = true;
        let roomStorage = Game.rooms[this.room].storage;
        if (roomStorage.store.getUsedCapacity(RESOURCE_ENERGY) > roomStorage.store.getCapacity(RESOURCE_ENERGY) / 3) {
            let currentBodyCost = global.Informant.calculateBodyCost(newBody);
            let totalEnergy = Game.rooms[this.room].energyCapacityAvailable - currentBodyCost;
            let targetWorks = 30;
            let numWork = 4;
            let index = 0;
            while(true) {
                if (numWork % 2 == 0 && (totalEnergy < 250 || 50 - newBody.length < 3)) {
                    if (this.link) {
                        //fill in extra with carry parts if there is a link
                        if (newBody.length < 50 && totalEnergy >= 50) {
                            newBody.splice(numWork, 0, CARRY);
                            totalEnergy -= 50;
                        } else break;
                    } else break;
                    continue;
                }
                if (totalEnergy >= 100 && numWork < targetWorks) {
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