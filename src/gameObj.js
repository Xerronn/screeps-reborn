//Screeps game object definition
class GameObj {
    constructor(id) {   
        this.id = id;
        this.updateTick = Game.time;
        this.update(true);
    }

    /**
     * Function that update objects with live game references
     * @param {boolean} force 
     * @returns 
     */
    update(force=false) {
        if (this.updateTick != Game.time || force == true) {
            this.liveObj = Game.getObjectById(this.id);
            if (!this.liveObj) {
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

    /**
     * Function to execute the main logic of the object per tick
     */
    run() {
        console.log("Override me please, " + this.constructor.name);
    }

    info() {
        return this.constructor.name + "<" + this.id + "> last updated on tick " + this.updateTick;
    }

    /**
     * Method to get the creep's supervisor
     * @returns Supervisor
     */
    getSupervisor() {
        return global.Imperator.administrators[this.room].supervisor;
    }

    /**
     * Method to get the creep's executive
     * @returns Executive
     */
    getExecutive() {
        return global.Imperator.administrators[this.room].executive;
    }
}

module.exports = GameObj;