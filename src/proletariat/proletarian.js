const GameObj = require("../gameObj");

//the parent creep definition
class Proletarian extends GameObj {
    constructor(creepId) {
        super(creepId);
        this.update(true);
    }

    update(force=false) {
        if (this.updateTick != Game.time || force == true) {
            super.update();
            this.body = this.liveObj.body;
            this.fatigue = this.liveObj.fatigue;
        } 
    }

    get body() {
        return this.body;
    }

    get fatigue() {
        return this.fatigue;
    }
}

module.exports = Proletarian;