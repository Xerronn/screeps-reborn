const Civitas = require("../civitas");

//makes minerals and boosts creeps
class Chemist extends Civitas {
    constructor(creepId) {
        super(creepId);

        this.reagentWorkshops = this.getSupervisor().reagentWorkshops;

        this.memory.targetChemical = RESOURCE_CATALYZED_GHODIUM_ACID;

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
        }
        return true;
    }

    run() {
        //aim to create 6000 of the target chemical, double the minimum amount
        let chemicalTargetAmount = 0;
        if (this.memory.targetChemical) {
            chemicalTargetAmount = 6000 - this.getChemicalAmount(this.memory.targetChemical);
        }
        if (this.memory.targetChemical === undefined || chemicalTargetAmount <= 0) {
            //if we have more than 6000 of the chemical, get a new target chemical
            this.memory.targetChemical = this.getExecutive().getTargetChemical();
        }
        let reactionChain = global.Informant.getChemicalChain(this.memory.targetChemical);
        let results = this.getTargetProduct(reactionChain, chemicalTargetAmount);
        let targetProduct = results.product;
        let targetReagents = results.reactants;
        let productTargetAmount = chemicalTargetAmount - this.getChemicalAmount(targetProduct);
        if (targetProduct == this.memory.targetChemical) {
            //if this is the last step, they should be the same
            productTargetAmount = chemicalTargetAmount;
        }

        //reagent labs are empty of minerals and creep is doing nothing
        if (this.getReagentsEmpty() && (!this.memory.task || this.memory.task === "idle")) {
            this.memory.task = "withdraw";
        }

        if (this.memory.task === "withdraw") {
            let productWorkshops = this.getSupervisor().productWorkshops;
            for (let workshop of productWorkshops) {
                if (workshop.mineralCount > 0) {
                    this.withdrawProducts(workshop); 
                    return true;
                }
            }
            this.memory.task = "supplyReagents"
            
        } else if (this.memory.task === "supplyReagents") {
            //stop any reactions from running while they are being filled
            this.getSupervisor().reserveWorkshop();
            
            for (let i = 0; i < 2; i++) {
                let totalAmount = Math.min(3000, productTargetAmount);
                if (this.reagentWorkshops[i].mineralCount !== undefined && 
                    this.reagentWorkshops[i].store.getUsedCapacity(targetReagents[i]) < totalAmount) {
                        let tripAmount = Math.min(
                            this.store.getCapacity(targetReagents[i]), 
                            totalAmount - this.reagentWorkshops[i].store.getUsedCapacity(targetReagents[i])
                        );

                        this.supplyReagent(this.reagentWorkshops[i], targetReagents[i], tripAmount); 
                        return true;
                }
            }
            //done supplying labs
            this.memory.task = "idle";
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
    supplyReagent(workshop, reagent, targetAmount) {
        //empty stores of anything other than reagent
        if (this.depositStore(reagent)) return;
        //now withdraw the reagent from its store
        if (this.store.getFreeCapacity(reagent) > 0 && workshop.store.getFreeCapacity(reagent) > 0) {
            if (this.withdrawStore(reagent, targetAmount)) return;
        }

        if (this.pos.inRangeTo(workshop.liveObj, 1)) {
            let amount = Math.min(this.store.getUsedCapacity(reagent), targetAmount);
            this.liveObj.transfer(workshop.liveObj, reagent, amount);
        } else {
            this.liveObj.moveTo(workshop.liveObj);
        }
    }

    /**
     * Method that takes the product from the labs
     * @param {Workshop} workshop 
     * @returns 
     */
    withdrawProducts(workshop) {
        let product = workshop.mineralType;
        if (this.store.getFreeCapacity(product) == 0) {
            if (this.depositStore()) return;
        }

        if (this.store.getFreeCapacity(product) > 0 && this.ticksToLive > 30) {
            if (this.withdrawWorkshop(workshop.liveObj, product)) return;
        } else if (this.ticksToLive < 30) {
            //prevent losing minerals 
            this.liveObj.suicide();
        }
    }

    /**
     * Method to withdraw a resource from the proper location
     * @param {*} res Resource constant
     * @returns If an action was taken
     */
    withdrawStore(res, targetAmount=10000) {
        let target;
        if (global.Vendor.resources.includes(res)) {
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