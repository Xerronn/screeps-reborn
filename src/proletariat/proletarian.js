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
        //! TODO: need to account for damaged body somehow
        this.body = this.liveObj.body.map(b => b.type);
        
        this.update(true);
    }

    update(force=false) {
        if (this.updateTick != Game.time || force == true) {
            //stop if you're dead
            if (!super.update(force)) {
                //only rebirth if the generation flag is there. If you want a creep to rebirth, set generation = 0 in the memory
                if (this.memory.generation !== undefined) {
                    global.Imperator.administrators[this.room].initiator.initiate(this, true);
                } else {
                    //delete this object
                    global.Imperator.administrators[this.room].initiator.dismiss(this);
                }
                return false;
            }
            this.store = this.liveObj.store;
            this.fatigue = this.liveObj.fatigue;
            this.memory = this.liveObj.memory;
            this.ticksToLive = this.liveObj.ticksToLive;
        }
        return true;
    }
}

module.exports = Proletarian;