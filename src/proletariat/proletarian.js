const GameObj = require("../gameObj");

//the parent creep definition
class Proletarian extends GameObj {
    constructor(creepId) {
        super(creepId);

        //attributes that will not change tick to tick
        if (!this.liveObj.memory.type) {
            //this should never happen
            this.type = "proletarian";
        } else {
            this.type = this.liveObj.memory.type;
        }
        
        this.update(true);
    }

    update(force=false) {
        if (this.updateTick != Game.time || force == true) {
            //stop if you're dead
            if (!super.update(force)) return false;
            this.body = this.liveObj.body;
            this.fatigue = this.liveObj.fatigue;   
        }
        return true;
    }
}

module.exports = Proletarian;