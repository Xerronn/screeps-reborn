//Screeps game object definition
class GameObj {
    constructor(id) {
        this.id = id;
        this.liveObj = Game.getObjectById(id);
        this.updateTick = Game.time;
    }

    get liveObj() {
        if (this.updateTick == Game.time) {
            return this.liveObj;
        } else {
            this.liveObj = Game.getObjectByID(this.id);
            return this.liveObj;
        }
    }

    info() {
        console.log("Game Object <" + this.id + "> last updated on tick" + this.updateTick)
    }
}

module.exports = GameObj;