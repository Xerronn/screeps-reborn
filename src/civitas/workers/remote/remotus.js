const Civitas = require("../../civitas");

//the parent combat creep definition
//must be passed a targetRoom in memory
class Remotus extends Civitas {
    constructor(creepId) {
        super(creepId);

        //attributes that do not change tick to tick
        if (this.memory.targetRoom) {
            this.targetRoom = this.memory.targetRoom;
        }
        this.arrived = false;

        this.update(true);
    }

    update(force=false) {
        if (this.updateTick != Game.time || force == true) {
            if (!super.update(force)) {
                //creep is dead
                return false;
            }
            //attributes that will change tick to tick

        }
        return true;
    }

    run() {
        if (!this.arrived) {
            //march to assigned room
            this.march();
        }
    }

    /**
     * Method to move the combat creep to their assigned room
     */
    march() {
        //if on an edge, path into current room
        if (this.isOnEdge()) {
            this.liveObj.moveTo(new RoomPosition(25,25, this.room));
        } else if (this.targetRoom != this.room) {
            this.liveObj.moveTo(new RoomPosition(25,25, this.targetRoom));
        } else {
            this.arrived = true;
        } 
    }
}

module.exports = Remotus;