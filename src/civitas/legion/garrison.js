const Legionnaire = require("./legionnaire");

//remote defender class definition
class Garrison extends Legionnaire {
    constructor(creepId) {
        super(creepId);

        this.update(true);
    }

    update(force=false) {
        if (this.updateTick != Game.time || force == true) {
            if (!super.update(force)) {
                //creep is dead, set flag so a new one can be spawned
                global.Archivist.setGarrisonSpawned(this.memory.spawnRoom, false);
                return false;
            }
            //attributes that change tick to tick
        }
        return true;
    }

    run() {
        //move to garrison target
        if (!this.arrived) {
            this.march()
            return;
        }

        //if there is a target, move to it and attack it
        if (this.target) {
            this.memory.task = "attack";
            this.melee();
        } else {
            global.Archivist.setGarrisonSpawned(this.memory.spawnRoom, false);
        }

        if (this.hits <= this.hitsMax - 300 || (this.hits < this.hitsMax && this.memory.task == "selfHeal") || (!this.target && this.hits < this.hitsMax)) {
            this.memory.task = "selfHeal";
            this.selfHeal();
        } else {
            if (!this.medic()) {
                this.garrison();
            }
            
        }
    }

    /**
     * Method to move towards middle of the room and hold position
     */
    garrison() {
        let position = new RoomPosition(25,25, this.targetRoom);
        if (!this.pos.inRangeTo(position, 10)) {
            this.liveObj.moveTo(position);
        }
    }
}

module.exports = Garrison;