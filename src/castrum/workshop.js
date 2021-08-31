const Castrum = require("./castrum");

//lab class definition
class Workshop extends Castrum {
    constructor(labId) {
        super(labId);

        let anchor = global.Archivist.getAnchor(this.room);
        this.type = this.classify({
            "x": this.pos.x - anchor.x,
            "y": this.pos.y - anchor.y
        });

        this.reagents = this.getSupervisor().reagentWorkshops;
        this.mineralCount = undefined;

        this.update(true);
    }

    update(force=false) {
        if (this.updateTick != Game.time || force == true) {
            if (!super.update(force)) return false;
            //attributes that can change tick to tick
            this.cooldown = this.liveObj.cooldown;
            //default to hydrogen just so this.mineralCount doesn't check for energy levels
            this.mineralType = this.liveObj.mineralType || RESOURCE_HYDROGEN;
            if (this.store) this.mineralCount = this.store.getUsedCapacity(this.mineralType);
        }
        return true;
    }

    run() {
        switch(this.type) {
            case "reagent":
                //do nothing?
                
                break;
            //everything else
            case "product":
                if (this.store.getUsedCapacity(RESOURCE_ENERGY) < Math.floor(this.store.getCapacity(RESOURCE_ENERGY) / (1/3))) {
                    global.Archivist.setLabsFilled(this.room, false);
                }
                if (this.getReagentsReady() && this.cooldown == 0) {
                    try {
                        this.liveObj.runReaction(this.reagents[0].liveObj, this.reagents[1].liveObj);
                    } catch (err) {

                    }
                    this.getSupervisor().productWorkshops
                }
                break;
        }
    }

    /**
     * Method that returns if the reagents are ready to react
     */
    getReagentsReady() {
        for (let workshop of this.reagents) {
            if (workshop.cooldown !== 0 || workshop.mineralCount === 0) {
                return false;
            }
        }
        return true;
    }

    /**
     * Method that takes anchor coordinates and calculates what type of lab it is
     * @param {Object} roomPosition 
     * @returns Lab classification
     */
    classify(roomPosition) {
        let reagents = [{"x":9,"y":8}, {"x":8,"y":9}];
        for (let coords of reagents) {
            if (coords.x == roomPosition.x && coords.y == roomPosition.y) {
                this.getSupervisor().reagentWorkshops.push(this);
                return "reagent";
            }
        }
        this.getSupervisor().productWorkshops.push(this);
        return "product";
    }
}

module.exports = Workshop;