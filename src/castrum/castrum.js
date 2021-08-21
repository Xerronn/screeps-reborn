const GameObj = require("../gameObj");

//the parent construct definition
class Castrum extends GameObj {
    constructor(constructId) {
        super(constructId);

        //attributes that will not change from tick to tick
        if (this.liveObj.store === undefined) {
            this.hasStore = false;
        } else {
            this.hasStore = true;
        }

        this.type = global.Informant.mapGameToClass(this.liveObj.structureType);

        this.update(true);
    }

    update(force=false) {
        if (this.updateTick != Game.time || force == true) {
            if (!super.update(force)) {
                //structure is dead
                return false;
            }

            if (this.hasStore) {
                this.store = this.liveObj.store;
            }
        }
        return true;
    }

    run() {
        return;
    }
}

module.exports = Castrum;