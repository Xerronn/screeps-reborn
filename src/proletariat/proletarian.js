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
        this.name = this.liveObj.name;
        
        this.update(true);
    }

    update(force=false) {
        if (this.updateTick != Game.time || force == true) {
            //stop if you're dead
            if (!super.update(force)) {
                //todo: This will fail if a global reset happens the same tick as a creep dies.
                //todo: Figure out a way to get around that
                global.Executive.schedule(Game.time + 1, "global.Initiator.initiate(objArr[0]);", [this])
                return false;
            }
            this.body = this.liveObj.body.map(b => b.type);
            this.fatigue = this.liveObj.fatigue;   
        }
        return true;
    }
}

module.exports = Proletarian;