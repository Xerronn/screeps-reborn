const Runner = require('./runner');

//creep tasked with primarily managing links, but also fills towers
class Arbiter extends Runner {
    constructor(creepId) {
        super(creepId);
        this.linkId = global.Imperator.administrators[this.room].supervisor.storageLink.id;

        this.update(true);
    }

    update(force=false) {
        if (this.updateTick != Game.time || force == true) {
            if (!super.update(force)) {
                //creep is dead
                return false;
            }
            //attributes that will change tick to tick
            this.link = Game.getObjectById(this.linkId);
        }
        return true;
    }

    run() {
        //if the link is not perfectly at 400, it needs action
        if (this.link.store.getUsedCapacity(RESOURCE_ENERGY) != 400) {
            this.linkAction = true;
        } else this.linkAction = false;

        if (this.ticksToLive < 300 || this.memory.task == "renew" || this.memory.task == "renewFill") {
            //start the loop by setting task to rewnewFill
            //this task will block spawning, but keep filling 
            //until reaching the required energy for a full renew
            if (this.memory.task != "renew") {
                this.memory.task = "renewFill";
            }
            this.renew();
        } else if (this.linkAction) {
            //LINK STUFF
            if (this.store.getUsedCapacity(RESOURCE_ENERGY) == 0 || (this.memory.task == "withdraw" && this.store.getFreeCapacity(RESOURCE_ENERGY) > 0)) {
                this.memory.task = "withdraw";
                //pull from the creepStorage this.link if it is higher than the sweet spot
                if (this.link.store.getUsedCapacity(RESOURCE_ENERGY) > 400) {
                    let amount = this.link.store.getUsedCapacity(RESOURCE_ENERGY) - 400;
                    this.withdrawLink(Math.min(amount, this.store.getUsedCapacity(RESOURCE_ENERGY)));
                } else {
                    this.withdrawStorage();
                }   
            } else {
                this.memory.task = "deposit";
                //transfer to the this.link if it is less than the sweet spot
                if (this.link.store.getUsedCapacity(RESOURCE_ENERGY) < 400) {
                    let amount = 400 - this.link.store.getUsedCapacity(RESOURCE_ENERGY);
                    this.depositLink(Math.min(amount, this.store.getUsedCapacity(RESOURCE_ENERGY)));
                } else {
                    this.depositStorage();
                }
            }
        } else if (this.store.getUsedCapacity(RESOURCE_ENERGY) == 0 || (this.memory.task == "withdraw" && this.store.getFreeCapacity(RESOURCE_ENERGY) > 0)) {
            this.memory.task = "withdraw";
            this.withdrawStorage();
        } else if (!global.Archivist.getTowersFilled(this.room)) {
            this.memory.task = "fillTowers";
            this.fillTowers();
        }
    }

    /**
     * Method that takes energy from link
     */
    withdrawLink(numEnergy=undefined) {
        if (this.pos.inRangeTo(this.link, 1)) {
            if (numEnergy !== undefined) {
                this.liveObj.withdraw(this.link, RESOURCE_ENERGY, numEnergy);
            } else {
                this.liveObj.withdraw(this.link, RESOURCE_ENERGY);
            }
        } else {
            this.liveObj.moveTo(this.link);
        }
    }

    /**
     * Method that gives energy to link
     */
    depositLink(numEnergy=undefined) {
        if (this.pos.inRangeTo(this.link, 1)) {
            if (numEnergy !== undefined) {
                this.liveObj.transfer(this.link, RESOURCE_ENERGY, numEnergy);
            } else {
                this.liveObj.transfer(this.link, RESOURCE_ENERGY);
            }
        } else {
            this.liveObj.moveTo(this.link);
        }
    }

    /**
     * Move to storage and deposit all stored energy
     */
    depositStorage() {
        let roomStorage = Game.rooms[this.room].storage;
        if (this.pos.inRangeTo(roomStorage, 1)) {
            this.liveObj.transfer(roomStorage, RESOURCE_ENERGY);
        } else {
            this.liveObj.moveTo(roomStorage);
        }
    }
}

module.exports = Arbiter;