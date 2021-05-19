const GameObj = require("../gameObj");

//the parent creep definition
class Proletarian extends GameObj {
    constructor(creepId) {
        super(creepId);
        this.update(true);
    }

    update(force=false) {
        if (this.updateTick != Game.time || force == true) {
            super.update(force);
            this.body = this.liveObj.body;
            this.fatigue = this.liveObj.fatigue;
        } 
    }
}

module.exports = Proletarian;