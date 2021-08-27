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

        if (!this.memory.reactionStage) {
            this.memory.reactionStage = 0;
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
        //all labs are empty of minerals and the creep is not currently supplying them
        if (this.getWorkshopsEmpty() && this.memory.task !== "supplyReagents") {
            let oldTarget = this.memory.targetChemical;
            this.memory.targetChemical = this.getExecutive().getTargetChemical();
            //if the targetChemical stays the same, we can increment the reaction stage
            if (oldTarget === this.memory.targetChemical) {
                this.memory.reactionStage++;
            } else {
                //reset it if the target does change, because we have to go back to the start
                this.memory.reactionStage = 0;
            }
            this.memory.task = "supplyReagents";
        }

        let targetReagents = global.Informant.getChemicalChain(this.memory.targetChemical)[this.memory.reactionStage];

        if (this.memory.task === "supplyReagents") {
            //stop any reactions from running while they are being filled
            this.getSupervisor().reserveWorkshop();
            
            for (let i = 0; i < 2; i++) {
                if (this.reagentWorkshops[i].mineralCount !== undefined && this.reagentWorkshops[i].store.getFreeCapacity(targetReagents[i]) > 0) {
                    this.supplyReagent(this.reagentWorkshops[i], targetReagents[i]); 
                    return true;
                }
            }
            //done supplying labs
            this.memory.task = "withdraw";
        } else if (this.memory.task === "withdraw") {
            let productWorkshops = this.getSupervisor().productWorkshops;
            for (let workshop of productWorkshops) {
                if (workshop.mineralCount > 0) {
                    this.withdrawProducts(workshop); 
                    return true;
                }
            }
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
    supplyReagent(workshop, reagent) {
        //empty stores of anything other than reagent
        if (this.deposit(reagent)) return;
        //now withdraw the reagent from its store
        if (this.store.getFreeCapacity(reagent) > 0) {
            if (this.withdraw(reagent)) return;
        }

        if (this.pos.inRangeTo(workshop.liveObj, 1)) {
            this.liveObj.transfer(workshop.liveObj, reagent);
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

        if (this.store.getFreeCapacity(product) > 0) {
            if (this.withdrawWorkshop(workshop.liveObj, product)) return;
        }
    }

    /**
     * Method to withdraw a resource from the proper location
     * @param {*} res Resource constant
     * @returns If an action was taken
     */
    withdrawStore(res) {
        let target = undefined;
        if (global.Vendor.resources.includes(res)) {
            target = Game.rooms[this.room].terminal;
        } else {
            target = Game.rooms[this.room].storage;
        }
        if (target.store.getUsedCapacity(res) > this.store.getFreeCapacity(res)) {
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
     * Method that deposits all held resources into their proper places
     * @returns If an action was taken
     */
    depositStore(ignoredResource) {
        for (let res in this.store) {
            if (ignoredResource !==  undefined && res == ignoredResource) continue;
            let target = undefined;
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
     * Method that returns if the reagents workshops are empty of minerals
     */
    getWorkshopsEmpty() {
        for (let workshop of this.getSupervisor().castrum.workshop) {
            if (workshop.mineralCount && workshop.mineralCount > 0) {
                return false;
            }
        }
        return true;
    }

}

module.exports = Chemist;