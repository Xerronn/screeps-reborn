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
            this.storage = Game.rooms[this.room].storage;
            this.terminal = Game.rooms[this.room].terminal;

            //supervisor makes a new wrapper whenever a construction site is finished
            this.linkWrapper = this.getSupervisor().storageLink;
            this.link = this.linkWrapper.liveObj;
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
         * Empty stores of minerals before dealing with minerals
         */
        for (let res in this.store) {
            if (res !== RESOURCE_ENERGY && this.store[res] > 0) {
                this.liveObj.transfer(this.storage, res);
            }
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
                return;
            } else {
                if (this.store.getUsedCapacity(RESOURCE_ENERGY) == 0 || (this.memory.task == "withdrawLink" && this.store.getFreeCapacity(RESOURCE_ENERGY) > 0)) {
                    this.memory.task = "withdrawLink";
                    this.withdrawLink();
                    return;
                }
                this.memory.task = "depositStorage";
                this.depositStorage();
                return;
            }
        }

        /**
         * Terminal Management. Puts energy into the terminal until it reaches 20k stored
         */
        let energyTarget = global.Vendor.getTarget(RESOURCE_ENERGY);
        if (this.terminal && this.terminal.store.getUsedCapacity(RESOURCE_ENERGY) < energyTarget) {
            if (this.store.getUsedCapacity(RESOURCE_ENERGY) == 0 || (this.memory.task == "withdraw" && this.store.getFreeCapacity(RESOURCE_ENERGY) > 0)) {
                this.memory.task = "withdraw";
                let amount = energyTarget - this.terminal.store.getUsedCapacity(RESOURCE_ENERGY);
                let tripAmount = Math.min(amount, this.store.getFreeCapacity(RESOURCE_ENERGY));
                this.withdrawStorage(tripAmount);
                return;
            } else {
                this.memory.task = "deposit";
                this.depositTerminal();
                return;
            }
        } else if (this.terminal && this.terminal.store.getUsedCapacity(RESOURCE_ENERGY) > energyTarget) {
            if (this.store.getUsedCapacity(RESOURCE_ENERGY) == 0 || (this.memory.task == "withdraw" && this.store.getFreeCapacity(RESOURCE_ENERGY) > 0)) {
                this.memory.task = "withdraw";
                let amount = this.terminal.store.getUsedCapacity(RESOURCE_ENERGY) - energyTarget;
                let tripAmount = Math.min(amount, this.store.getFreeCapacity(RESOURCE_ENERGY));
                this.withdrawTerminal(tripAmount);
                return;
            } else {
                this.memory.task = "deposit";
                this.depositStorage();
                return;
            }
        }

        /**
         * Empty stores of energy before dealing with minerals
         */
        if (this.store.getUsedCapacity(RESOURCE_ENERGY) > 0) {
            this.depositStorage();
        }

        /**
         * Keep terminal full of minerals only
         */
        if (Object.keys(this.terminal.store).length > global.Vendor.resources.length) {
            for (let res in this.terminal.store) {
                if (!global.Vendor.resources.includes(res)) {
                    if (this.store.getUsedCapacity(res) == 0 || (this.memory.task == "withdraw" && this.store.getFreeCapacity(res) > 0)) {
                        this.memory.task = "withdraw";
                        this.liveObj.withdraw(this.terminal, res);
                        return;
                    } else {
                        this.memory.task = "deposit";
                        this.liveObj.transfer(this.storage, res);
                        return;
                    }
                }
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
     withdrawStorage(numEnergy=undefined) {
        if (numEnergy !== undefined) {
            this.liveObj.withdraw(this.storage, RESOURCE_ENERGY, numEnergy);
        } else {
            this.liveObj.withdraw(this.storage, RESOURCE_ENERGY);
        }
    }

    /**
     * Withdraw energy from terminal
     */
    withdrawTerminal(numEnergy=undefined) {
        if (numEnergy !== undefined) {
            this.liveObj.withdraw(this.terminal, RESOURCE_ENERGY, numEnergy);
            global.Vendor.balances[this.room][RESOURCE_ENERGY] -= numEnergy;
        } else {
            this.liveObj.withdraw(this.terminal, RESOURCE_ENERGY);
            global.Vendor.balances[this.room][RESOURCE_ENERGY] -= numEnergy;
        }
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
    depositStorage(numEnergy=undefined) {
        if (numEnergy !== undefined) {
            this.liveObj.transfer(this.storage, RESOURCE_ENERGY, numEnergy);
        } else {
            this.liveObj.transfer(this.storage, RESOURCE_ENERGY);
        }
    }

    /**
     * Move to terminal and deposit all stored energy
     */
     depositTerminal(numEnergy=undefined) {
        if (numEnergy !== undefined) {
            this.liveObj.transfer(this.terminal, RESOURCE_ENERGY, numEnergy);
            //increment balances in the vendor as energy is added
            global.Vendor.balances[this.room][RESOURCE_ENERGY] += numEnergy;
        } else {
            this.liveObj.transfer(this.terminal, RESOURCE_ENERGY);
            //increment balances in the vendor as energy is added
            global.Vendor.balances[this.room][RESOURCE_ENERGY] += this.store.getUsedCapacity(RESOURCE_ENERGY);
        }
        
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