const Civitas = require("../civitas");

//the parent combat creep definition
class Legionnaire extends Civitas {
    constructor(creepId) {
        super(creepId);

        //attributes that do not change tick to tick
        this.targetRoom = this.memory.targetRoom;
        this.arrived = false;

        this.update(true);
    }

    update(force=false) {
        if (this.updateTick != Game.time || force == true) {
            if (!super.update(force)) {
                //creep is dead
            }
            //attributes that will change tick to tick

        }
        return true;
    }

    run() {
        if (!this.arrived) {
            //! todo: will never leave the room
            this.march();
        }
    }

    /**
     * Method to move the combat creep to their assigned room
     */
    march() {
        //if on an edge, path into current room
        if (this.getOnEdge()) {
            this.liveObj.moveTo(new RoomPosition(25,25, this.room));
        } else if (this.targetRoom != this.room) {
            this.travelTo(new RoomPosition(25,25, this.targetRoom));
        } else {
            this.arrived = true;
        } 
    }
}

module.exports = Legionnaire;