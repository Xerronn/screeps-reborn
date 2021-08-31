const Civitas = require("../civitas");

//makes minerals and boosts creeps
class Chemist extends Civitas {
    constructor(creepId) {
        super(creepId);

        this.reagentWorkshops = this.getSupervisor().reagentWorkshops;

        let anchor = global.Archivist.getAnchor(this.room);
        this.idleSpot = {
            'x': anchor.x + 6, 
            'y': anchor.y + 9
        }

        this.update(true);
    }

    update(force) {
        if (this.updateTick != Game.time || force == true) {
            if (!super.update(force)) {
                //creep is dead
                return false;
            }
            //attributes that change tick to tick
            //aim to create 6000 of the target chemical, double the minimum amount
            this.chemicalTargetAmount = 0;
            if (this.memory.targetChemical) {
                this.chemicalTargetAmount = 6000 - this.getChemicalAmount(this.memory.targetChemical);
            }
            if (this.memory.targetChemical === undefined || this.chemicalTargetAmount <= 0) {
                //if we have more than 6000 of the chemical, get a new target chemical
                let old = this.memory.targetChemical;
                this.memory.targetChemical = this.getExecutive().getTargetChemical();

                //just make more if the new chemical is the same as the old one
                if (this.memory.targetChemical == old) {
                    this.chemicalTargetAmount = 3000;
                }
            }
        }
        return true;
    }

    run() {
        if (!this.memory.targetChemical) {
            return;
        }
        let productTargetAmount;
        if (this.memory.targetProduct) {
            productTargetAmount = this.chemicalTargetAmount - this.getChemicalAmount(this.memory.targetProduct);
        }
        if (!this.memory.targetProduct || productTargetAmount <= 0) {
            let reactionChain = global.Informant.getChemicalChain(this.memory.targetChemical);
            let results = this.getTargetProduct(reactionChain, this.chemicalTargetAmount);
            this.memory.targetProduct = results.product;
            this.memory.targetReagents = results.reactants;
            productTargetAmount = this.chemicalTargetAmount - this.getChemicalAmount(this.memory.targetProduct);
        }
        
        if (this.memory.targetProduct == this.memory.targetChemical) {
            //if this is the last step, they should be the same
            productTargetAmount = this.chemicalTargetAmount;
        }

        //reagent labs are empty of minerals and creep is doing nothing
        if (this.getReagentsEmpty() && (!this.memory.task || this.memory.task === "idle")) {
            this.memory.task = "withdraw";
        }

        if (this.memory.task === "withdraw") {
            if (this.withdrawProducts()) return true;

            //labs are empty, move to next mineral in the chain
            this.memory.task = "supplyReagents"
            
        } else if (this.memory.task === "supplyReagents") {
            //stop any reactions from running while they are being filled
            this.getSupervisor().reserveWorkshop();
            let tripAmount = Math.min(3000, productTargetAmount);
            if (this.supplyReagents(this.memory.targetReagents, tripAmount)) return true;

            //done supplying labs
            this.memory.task = "idle";
        }

        //fill labs with energy
        if (!global.Archivist.getLabsFilled(this.room)) {
            console.log("im here")
            if (this.energizeLabs()) return;
        }
        
        //idle
        if (this.pos.x != this.idleSpot.x || this.pos.y != this.idleSpot.y) {
            let roomPosIdle = new RoomPosition(this.idleSpot.x, this.idleSpot.y, this.room);
            this.liveObj.moveTo(roomPosIdle);
        }
    }

    /**
     * Method that fills up the reagent labs with the target mineral
     */
    supplyReagents(targetReagents, targetAmount) {
        //loop through the two reagentWorkshops
        for (let i = 0; i < 2; i++) {
            if (this.reagentWorkshops[i].mineralCount !== undefined && 
                this.reagentWorkshops[i].store.getUsedCapacity(targetReagents[i]) < targetAmount) {

                if (this.depositStore(targetReagents[i])) return true;
                let tripAmount = Math.min(
                    this.store.getFreeCapacity(targetReagents[i]), 
                    targetAmount - this.reagentWorkshops[i].store.getUsedCapacity(targetReagents[i])
                );
                //fill up creep to match what is needed for the lab
                if (this.store.getUsedCapacity(targetReagents[i]) < tripAmount) {
                    if (this.withdrawStore(targetReagents[i], tripAmount)) return true;
                }
                //move to lab and deposit the amount
                if (this.pos.inRangeTo(this.reagentWorkshops[i].liveObj, 1)) {
                    this.liveObj.transfer(this.reagentWorkshops[i].liveObj, targetReagents[i], tripAmount);
                } else {
                    this.liveObj.moveTo(this.reagentWorkshops[i].liveObj);
                }
                return true;
            }
        }
        return false;
    }

    /**
     * Method that takes the product from all the reactant labs
     * @returns 
     */
    withdrawProducts() {
        let productWorkshops = this.getSupervisor().productWorkshops;
        for (let workshop of productWorkshops) {
            if (workshop.mineralCount > 0) {
                let product = workshop.mineralType;
                if (this.store.getFreeCapacity(product) > 0) {
                    if (this.withdrawWorkshop(workshop.liveObj, product)) return true;
                }
            }
        }
        //deposit anything the creep has once it reaches this point
        if (this.depositStore()) return true;
    }

    /**
     * Method that fills up labs when they need energy
     * @returns if an action is taken
     */
    energizeLabs() {
        if (this.store.getUsedCapacity(RESOURCE_ENERGY) == 0) {
            this.withdrawStore(RESOURCE_ENERGY);
            return true;
        }
        let productWorkshops = this.getSupervisor().productWorkshops;
        for (let workshop of productWorkshops) {
            if (workshop.store.getFreeCapacity(RESOURCE_ENERGY) > 0) {
                if (this.pos.inRangeTo(workshop.liveObj, 1)) {
                    this.liveObj.transfer(workshop.liveObj, RESOURCE_ENERGY);
                } else {
                    this.liveObj.moveTo(workshop.liveObj);
                }
                return true;
            }
        }
        global.Archivist.setLabsFilled(this.room, true);
        return false;
    }

    /**
     * Method to withdraw a resource from the proper location
     * @param {RESOURCE_TYPE} res Resource constant
     * @param {Integer} targetAmount the amount to withdraw, default to the creep's carry capacity
     * @returns If an action was taken
     */
    withdrawStore(res, targetAmount=10000) {
        let target;
        if (res !== RESOURCE_ENERGY && global.Vendor.resources.includes(res)) {
            target = Game.rooms[this.room].terminal;
        } else {
            target = Game.rooms[this.room].storage;
        }
        if (target.store.getUsedCapacity(res) >= this.store.getFreeCapacity(res) && this.ticksToLive > 30) {
            if (this.pos.inRangeTo(target, 1)) {
                let amount = Math.min(this.store.getFreeCapacity(res), targetAmount);
                let result = this.liveObj.withdraw(target, res, amount);

                if (target.structureType == STRUCTURE_TERMINAL && result == OK) {
                    global.Vendor.balances[this.room][res] -= amount;
                }
            } else {
                this.liveObj.moveTo(target);
            }
            return true;
        } else if (this.ticksToLive < 30) {
            //prevent losing minerals 
            this.liveObj.suicide();
        }
        return false;
    }


    /**
     * Method that deposits all held resources into their proper places
     * @returns If an action was taken
     */
    depositStore(ignoredResource) {
        for (let res in this.store) {
            if (ignoredResource !==  undefined && res == ignoredResource) continue;
            let target;
            if (global.Vendor.resources.includes(res)) {
                target = Game.rooms[this.room].terminal;
            } else {
                target = Game.rooms[this.room].storage;
            }

            if (this.pos.inRangeTo(target, 1)) {
                this.liveObj.transfer(target, res);
            } else {
                this.liveObj.moveTo(target);
            }
            return true;
        }
        return false;
    }

    /**
     * Method to withdraw a resource from a workshop
     * @param {Position} target 
     * @param {Resource} res 
     * @returns 
     */
    withdrawWorkshop(target, res) {
        if (target.store.getUsedCapacity(res) > 0) {
            if (this.pos.inRangeTo(target, 1)) {
                this.liveObj.withdraw(target, res);
            } else {
                this.liveObj.moveTo(target);
            }
            return true;
        }
        return false;
    }

    /**
     * Method that returns the amount of a chemical is in storage
     */
    getChemicalAmount(resourceType) {
        let target;
        if (resourceType === undefined) return undefined;
        if (global.Vendor.resources.includes(resourceType)) {
            target = Game.rooms[this.room].terminal;
        } else {
            target = Game.rooms[this.room].storage;
        }

        return target.store.getUsedCapacity(resourceType);
    }

    /**
     * Method that returns if the reagents workshops are empty of minerals
     */
    getReagentsEmpty() {
        for (let workshop of this.reagentWorkshops) {
            if (workshop.mineralCount && workshop.mineralCount > 0) {
                return false;
            }
        }
        return true;
    }

    /**
     * Method that calculates which mineral to make and how much of it to reach the target
     */
    getTargetProduct(chain, target) {
        for (let res in chain) {
            let resAmount = this.getChemicalAmount(res);
            if (resAmount < target) {
                if (Object.keys(chain[res]).length != 0) {
                    return this.getTargetProduct(chain[res], target);
                }
            }
        }
        let minerals = Object.keys(chain);
        return {
            "product": REACTIONS[minerals[0]][minerals[1]],
            "reactants" : [minerals[0], minerals[1]]
        }
    }
}

module.exports = Chemist;