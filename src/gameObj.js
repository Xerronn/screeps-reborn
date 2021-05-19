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
            this.updateTick = Game.time;
            this.liveObj = Game.getObjectById(this.id);
            this.pos = this.liveObj.pos;
            this.room = this.liveObj.room;
            this.hits = this.liveObj.hits;
            this.maxHits = this.liveObj.hitsMax;
        }
    }

    info() {
        return this.constructor.name + "<" + this.id + "> last updated on tick " + this.updateTick;
    }
}

module.exports = GameObj;