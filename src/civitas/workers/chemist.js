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
            this.memory.targetChemical = this.getExecutive().getTargetChemical();
            this.chemicalTargetAmount = 3000;
        }
        return true;
    }

    run() {
        //prevent chemist from losing any minerals to death
        if (this.ticksToLive < 30) {
            if (this.depositStore()) return true;
            this.liveObj.suicide();
            return false;
        }
        //handle boosting of creeps
        if (this.memory.boosting === true) {
            if (this.memory.task === "supplyReagents" || this.memory.task === "awaitingSupply") this.getSupervisor().reserveWorkshop();
            if (this.prepareBoosts()) return true;
        }

        //handle chemical production
        if (!this.memory.targetChemical) {
            return;
        }
        
        if (!this.memory.targetProduct || !this.memory.targetReagents) {
            let reactionChain = global.Informant.getChemicalChain(this.memory.targetChemical);
            let results = this.getTargetProduct(reactionChain, this.chemicalTargetAmount);
            this.memory.targetProduct = results.product;
            this.memory.targetReagents = results.reactants;
        }
        
        //reagent labs are empty of minerals and creep is doing nothing
        if (this.getReagentsEmpty() && (!this.memory.task || this.memory.task === "idle")) {
            this.memory.task = "withdraw";
            let reactionChain = global.Informant.getChemicalChain(this.memory.targetChemical);
            let results = this.getTargetProduct(reactionChain, this.chemicalTargetAmount);
            this.memory.targetProduct = results.product;
            this.memory.targetReagents = results.reactants;
        }

        let productTargetAmount = this.chemicalTargetAmount - this.getChemicalAmount(this.memory.targetProduct);

        if (this.memory.targetProduct == this.memory.targetChemical) {
            //if this is the last step, they should be the same
            productTargetAmount = this.chemicalTargetAmount;
        }

        if (this.memory.task === "withdraw") {
            if (this.withdrawProducts()) return true;

            //labs are empty, move to next mineral in the chain
            this.memory.task = "supplyReagents"
            
        }
        if (this.memory.task === "supplyReagents") {
            //stop any reactions from running while they are being filled
            this.getSupervisor().reserveWorkshop();
            let tripAmount = Math.min(3000, productTargetAmount);
            if (this.supplyReagents(this.memory.targetReagents, tripAmount)) return true;

            //done supplying labs
            this.memory.task = "idle";
        }
        if (this.memory.task == "awaitingSupply") {
            this.getSupervisor().reserveWorkshop();
            if (this.getChemicalAmount(this.memory.targetReagents[0]) >= this.store.getCapacity(this.memory.targetReagents[0]) && 
                this.getChemicalAmount(this.memory.targetReagents[1]) >= this.store.getCapacity(this.memory.targetReagents[1])) {
                    this.memory.task = "supplyReagents";
            }
        }

        //fill labs with energy
        if (!global.Archivist.getLabsFilled(this.room)) {
            if (this.energizeLabs()) return;
        }

        //empty stores
        if (this.depositStore()) return;
        
        //idle
        if (this.pos.x != this.idleSpot.x || this.pos.y != this.idleSpot.y) {
            let roomPosIdle = new RoomPosition(this.idleSpot.x, this.idleSpot.y, this.room);
            this.liveObj.travelTo(roomPosIdle);
        }
    }

    /**
     * Method that locks a workshop down and fills it up with the proper boost chemicals
     */
    prepareBoosts() {
        let boost = this.memory.boostTypes[0];
        let amount = this.memory.boostCounts[0];

        if (boost === undefined) return false;

        let selectedWorkshop = global.Imperator.getWrapper(this.memory.boostingLab);
        if (!selectedWorkshop) {
            let productWorkshops = this.getSupervisor().productWorkshops;
            for (let workshop of productWorkshops) {
                if (workshop.boosting) continue;
                if (!workshop.boosting && (selectedWorkshop === undefined || selectedWorkshop.cooldown > workshop.cooldown)) {
                    selectedWorkshop = workshop;
                }
            }
            if (selectedWorkshop === undefined) return false;
            this.memory.boostingLab = selectedWorkshop.id;
            selectedWorkshop = global.Imperator.getWrapper(this.memory.boostingLab);
        }
        //if we don't have enough boost to do the body, then just skip it
        if (this.getChemicalAmount(boost) + this.store.getUsedCapacity(boost) + selectedWorkshop.store.getUsedCapacity(boost) < amount) {
            delete this.memory.boostingLab;
            this.memory.boostTypes.shift();
            this.memory.boostCounts.shift();
            return true;
        }
        if (this.depositStore(boost)) return true;

        //now we have the lowest cd workshop, toggle that it is the boosting lab
        selectedWorkshop.boosting = true;
        let old = global.Archivist.getBoostingWorkshops(this.room);
        old[boost] = selectedWorkshop.id;
        global.Archivist.setBoostingWorkshops(this.room, old);

        //empty the workshop of its minerals if it does not contain the boost
        let product = selectedWorkshop.mineralType;
        if (product !== boost && selectedWorkshop.store.getUsedCapacity(product) > 0) {
            if (this.withdrawWorkshop(selectedWorkshop.liveObj, product)) return true;
        }
        if (selectedWorkshop.mineralCount < amount) {
            //withdraw the boost we need
            let tripAmount = Math.min(
                this.store.getFreeCapacity(boost), 
                amount - selectedWorkshop.store.getUsedCapacity(boost)
            );
            if (this.store.getUsedCapacity(boost) < tripAmount) {
                if (this.withdrawStore(boost, tripAmount)) return true;
            }

            //deposit it in the lab
            if (this.pos.inRangeTo(selectedWorkshop.liveObj, 1)) {
                this.liveObj.transfer(selectedWorkshop.liveObj, boost, tripAmount);
            } else {
                this.liveObj.travelTo(selectedWorkshop.liveObj);
            }
            return true;
        }

        delete this.memory.boostingLab;
        this.memory.boostTypes.shift();
        this.memory.boostCounts.shift();
        if (this.memory.boostTypes.length == 0) {
            this.memory.boosting = false;
            return false;
        }
        return true;
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
                    if (this.getChemicalAmount(targetReagents[i]) < tripAmount) {
                        this.memory.task = "awaitingSupply";
                    }
                    if (this.withdrawStore(targetReagents[i], tripAmount)) return true;
                }
                //move to lab and deposit the amount
                if (this.pos.inRangeTo(this.reagentWorkshops[i].liveObj, 1)) {
                    this.liveObj.transfer(this.reagentWorkshops[i].liveObj, targetReagents[i], tripAmount);
                } else {
                    this.liveObj.travelTo(this.reagentWorkshops[i].liveObj);
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
            if (workshop.mineralCount > 0 && !workshop.boosting) {
                let product = workshop.mineralType;
                if (this.store.getFreeCapacity(product) > 0) {
                    if (this.withdrawWorkshop(workshop.liveObj, product)) return true;
                }
            }
        }
        //deposit anything the creep has once it reaches this point
        if (this.depositStore()) return true;
        return false;
    }

    /**
     * Method that fills up labs when they need energy
     * @returns if an action is taken
     */
    energizeLabs() {
        let productWorkshops = this.getSupervisor().productWorkshops;
        for (let workshop of productWorkshops) {
            if (workshop.store.getFreeCapacity(RESOURCE_ENERGY) > 0) {
                //fill up creep with required energy
                let tripAmount = Math.min(this.store.getFreeCapacity(RESOURCE_ENERGY), workshop.store.getFreeCapacity(RESOURCE_ENERGY));
                if (this.store.getUsedCapacity(RESOURCE_ENERGY) < tripAmount) {
                    this.withdrawStore(RESOURCE_ENERGY, tripAmount);
                    return true;
                }
                if (this.pos.inRangeTo(workshop.liveObj, 1)) {
                    this.liveObj.transfer(workshop.liveObj, RESOURCE_ENERGY);
                } else {
                    this.liveObj.travelTo(workshop.liveObj);
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
        if (target.store.getUsedCapacity(res) >= this.store.getFreeCapacity(res)) {
            if (this.pos.inRangeTo(target, 1)) {
                let amount = Math.min(this.store.getFreeCapacity(res), targetAmount);
                let result = this.liveObj.withdraw(target, res, amount);

                if (target.structureType == STRUCTURE_TERMINAL && result == OK) {
                    global.Vendor.balances[this.room][res] -= amount;
                }
            } else {
                this.liveObj.travelTo(target);
            }
            return true;
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
                this.liveObj.travelTo(target);
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
                this.liveObj.travelTo(target);
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