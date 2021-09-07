const Castrum = require("./castrum");

//terminal wrapper
class Market extends Castrum {
    constructor(id) {
        super(id);
        this.cooldown = 0;
        this.nextCheck = Game.time;
    }

    update(force=false) {
        if (this.updateTick != Game.time || force == true) {
            if (!super.update(force)) return false;
            this.cooldown = this.liveObj.cooldown;
        }
        return true;
    }

    run() {
        if (Game.time % 500 == 0) {
            global.Vendor.document(this.room);
        } 
        
        if (this.cooldown == 0 && this.nextCheck <= Game.time) {
            let needs = global.Vendor.getNeeds(this.room);
            if (needs.length > 0) {
                for (let need of needs) {
                    if (global.Vendor.surpluses[need].length > 0) {
                        global.Vendor.relinquish(global.Vendor.surpluses[need][0]);
                        return;
                    }
                }
                if (global.Vendor.requisition(this.room)) {
                    return;
                }
            }
            //if no needs are found, check again in 50 ticks
            this.nextCheck = Game.time + 50;
        }

        //todo: everything with auto selling. temp solution
        if (global.Vendor.balances[this.room][RESOURCE_ENERGY] >= 0 && Game.rooms[this.room].storage.store.getUsedCapacity(RESOURCE_ENERGY) > 450000) {
            global.Vendor.merchandise(this.room, [RESOURCE_ENERGY]);
        }
    }
}

module.exports = Market;