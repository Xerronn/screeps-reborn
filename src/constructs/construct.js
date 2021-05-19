const GameObj = require("../gameObj");

//the parent construct definition
class Construct extends GameObj {
    constructor(constructId) {
        super(constructId);

        //attributes that will not change from tick to tick
        if (this.liveObj.store == undefined) {
            this.hasStore = false;
        } else {
            this.hasStore = true;
        }

        this.update(true);
    }

    update(force=false) {
        if (this.updateTick != Game.time || force == true) {
            super.update(force);

            if (this.hasStore) {
                this.store = this.liveObj.store;
            }
        }
    }
}

module.exports = Construct;