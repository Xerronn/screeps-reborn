//Screeps game object definition
class GameObj {
    constructor(id) {
        this.id = id;
        this.updateTick = Game.time;
        this.update(true);
    }

    //this should be called once per tick
    update(force=false) {
        if (this.updateTick != Game.time || force == true) {
            this.liveObj = Game.getObjectById(this.id);
            if (!this.liveObj) {
                //todo: should schedule it for next tick using executive so it doesn't get lost on global reset
                global.Initiator.initiate(this);
                return false;
            }
            this.updateTick = Game.time;
            this.pos = this.liveObj.pos;
            this.room = this.liveObj.room.name;
            this.hits = this.liveObj.hits;
            this.maxHits = this.liveObj.hitsMax;
        }
        return true;
    }

    info() {
        return this.constructor.name + "<" + this.id + "> last updated on tick " + this.updateTick;
    }
}

module.exports = GameObj;