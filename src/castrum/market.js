const Castrum = require("./castrum");

//terminal wrapper
class Market extends Castrum {
    constructor(id) {
        super(id);
        this.cooldown = 0;
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
        
        if (this.cooldown == 0) {
            let needs = global.Vendor.getNeeds(this.room);
            if (needs.length > 0) {
                for (let need of needs) {
                    if (global.Vendor.surpluses[need].length > 0) {
                        global.Vendor.relinquish(global.Vendor.surpluses[need][0]);
                        return;
                    }
                }
                global.Vendor.requisition(this.room);
            }
        }
    }
}

module.exports = Market;