const Runner = require('./runner');

//creep tasked with primarily managing links, but also fills towers
class Arbiter extends Runner {
    constructor(creepId) {
        super(creepId);
        this.linkId = this.getSupervisor().storageLink.id;
        this.linkWrapper = this.getSupervisor().storageLink;

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
            this.storage = Game.rooms[this.room].storage;
            this.terminal = Game.rooms[this.room].terminal;
        }
        return true;
    }

    run() {
        if (this.ticksToLive < 300 || this.memory.task == "renew" || this.memory.task == "renewFill") {
            //start the loop by setting task to renewFill
            //this task will block spawning, but keep filling 
            //until reaching the required energy for a full renew
            if (this.memory.task != "renew") {
                this.memory.task = "renewFill";
            }
            //renew with usePrime
            this.renew(true);
            return;
        }

        /**
         * Link Management. Keep the link at zero except when it requests to be filled
         */
        if (this.link.store.getUsedCapacity(RESOURCE_ENERGY) != 0 || this.linkWrapper.needsFilling) {
            if (this.linkWrapper.needsFilling) {
                if (this.store.getUsedCapacity(RESOURCE_ENERGY) == 0 || (this.memory.task == "withdrawStorage" && this.store.getFreeCapacity(RESOURCE_ENERGY) > 0)) {
                    this.memory.task = "withdrawStorage";
                    this.withdrawStorage();
                    return;
                }
                this.memory.task = "depositLink";
                this.depositLink();
            } else {
                if (this.store.getUsedCapacity(RESOURCE_ENERGY) == 0 || (this.memory.task == "withdrawLink" && this.store.getFreeCapacity(RESOURCE_ENERGY) > 0)) {
                    this.memory.task = "withdrawLink";
                    this.withdrawLink();
                    return;
                }
                this.memory.task = "depositStorage";
                this.depositStorage();
            }
        }

        /**
         * Terminal Management. Puts energy into the terminal until it reaches 20k stored
         */
        if (this.terminal && this.terminal.store.getUsedCapacity(RESOURCE_ENERGY) < 20000) {
            if (this.store.getUsedCapacity(RESOURCE_ENERGY) == 0 || (this.memory.task == "withdraw" && this.store.getFreeCapacity(RESOURCE_ENERGY) > 0)) {
                this.memory.task = "withdraw";
                this.withdrawStorage(); 
            } else {
                this.memory.task = "deposit";
                this.depositTerminal();
            }
        } else if (this.terminal && this.terminal.store.getUsedCapacity(RESOURCE_ENERGY) > 21000) {
            if (this.store.getUsedCapacity(RESOURCE_ENERGY) == 0 || (this.memory.task == "withdraw" && this.store.getFreeCapacity(RESOURCE_ENERGY) > 0)) {
                this.memory.task = "withdraw";
                this.withdrawTerminal(); 
            } else {
                this.memory.task = "deposit";
                this.depositStorage();
            }
        }
    }

    /**
     * Method that takes energy from link
     */
    withdrawLink(numEnergy=undefined) {
        if (numEnergy !== undefined) {
            this.liveObj.withdraw(this.link, RESOURCE_ENERGY, numEnergy);
        } else {
            this.liveObj.withdraw(this.link, RESOURCE_ENERGY);
        }
    }

    /**
     * Overloaded withdrawStorage with no moves
     */
     withdrawStorage() {
        this.liveObj.withdraw(this.storage, RESOURCE_ENERGY);
    }

    /**
     * Withdraw energy from terminal
     */
    withdrawTerminal() {
        this.liveObj.withdraw(this.terminal, RESOURCE_ENERGY);
    }

    /**
     * Method that gives energy to link
     */
    depositLink(numEnergy=undefined) {
        if (numEnergy !== undefined) {
            this.liveObj.transfer(this.link, RESOURCE_ENERGY, numEnergy);
        } else {
            this.liveObj.transfer(this.link, RESOURCE_ENERGY);
        }
    }

    /**
     * Move to storage and deposit all stored energy
     */
    depositStorage() {
        this.liveObj.transfer(this.storage, RESOURCE_ENERGY);
    }

    /**
     * Move to terminal and deposit all stored energy
     */
     depositTerminal() {
        this.liveObj.transfer(this.terminal, RESOURCE_ENERGY);
        //increment balances in the vendor as energy is added
        global.Vendor.balances[this.room][RESOURCE_ENERGY] += this.store.getUsedCapacity(RESOURCE_ENERGY);
    }

    /**
     * Evolve the arbiter as it has more responsibilities
     */
    evolve() {
        let liveRoom = Game.rooms[this.room];
        let newBody = [];
        if (liveRoom.controller.level >= 6 && liveRoom.terminal) {
            //once the room has a terminal
            newBody= [
                //400 carry capacity
                CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY
            ]
        }
        if (liveRoom.controller.level == 8) {
            //800 carry capacity
            newBody = [
                CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY,
                CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY
            ]
        }

        if (newBody.length > this.memory.body.length) {
            this.memory.body = newBody;
            this.liveObj.suicide();
        }
    }
}

module.exports = Arbiter;