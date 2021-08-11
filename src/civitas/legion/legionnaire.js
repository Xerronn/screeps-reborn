const Remotus = require("../workers/remote/remotus");

//the parent combat creep definition
//must be passed a targetRoom in memory
class Legionnaire extends Remotus {
    constructor(creepId) {
        super(creepId);

        this.update(true);
    }

    update(force=false) {
        if (this.updateTick != Game.time || force == true) {
            if (!super.update(force)) {
                //creep was killed
                return false;
            }
            //attributes that will change tick to tick
            this.target = Game.getObjectById(this.memory.target);
            if (!this.target) this.acquireTarget();
        }
        return true;
    }

    /**
     * Method to acquire an attack target
     */
    acquireTarget() {
        let allTargets = Game.rooms[this.room].find(FIND_HOSTILE_CREEPS);

        if (allTargets.length > 0) {
            this.target = this.pos.findClosestByRange(allTargets);
            this.memory.target = this.target.id;
        } else this.memory.target = "none";
    }

    /**
     * Method to melee attack a target
     */
    melee() {
        if (this.pos.inRangeTo(this.target, 1)) {
            this.liveObj.attack(this.target);
        } else {
            this.liveObj.moveTo(this.target);
        }
    }

    /**
     * Method for a creep to heal itself
     */
    selfHeal() {
        this.liveObj.heal(this.liveObj);
    }
}

module.exports = Legionnaire;