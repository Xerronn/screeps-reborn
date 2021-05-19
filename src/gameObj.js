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
            this.liveObj = Game.getObjectById(id);
            this.pos = this.liveObj.pos;
            this.room = this.liveObj.room;
            this.hits = this.liveObj.hits;
            this.maxHits = this.liveObj.hitsMax;
        }
    }

    get liveObj() {
        return this.liveObj;
    }

    get pos() {
        return this.pos;
    }

    get room() {
        return this.room;
    }

    get hits() {
        return this.hits;
    }

    get maxHits() {
        return this.maxHits;
    }

    info() {
        console.log("Game Object <" + this.id + "> last updated on tick" + this.updateTick)
    }
}

module.exports = GameObj;