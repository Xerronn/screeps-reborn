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
        this.fleeing = false;

        this.update(true);
    }

    update(force=false) {
        if (this.updateTick != Game.time || force == true) {
            if (!super.update(force)) {
                //creep is dead
                return false;
            }
            //attributes that will change tick to tick
            if (this.room !== this.targetRoom) {
                this.arrived = false;
            }

        }
        return true;
    }

    /**
     * Parent remote creep Method that marches to an assigned room and flees if there is danger
     * @param {Boolean} shouldMarch if the creep should participate in marching
     * @param {Boolean} shouldFlee if the creep should participate in fleeing
     * @returns if the run function did anything
     */
    run(shouldMarch = true, shouldFlee = true, offRoad=false) {
        if (shouldMarch && !this.arrived && !this.fleeing) {
            //march to assigned room
            this.march(this.targetRoom, offRoad);
            return true;
        }

        if (shouldFlee) {
            if (global.Archivist.getGarrisonSpawned(this.memory.spawnRoom)) {
                this.flee();
                return true;
            }

            //check for hostile creeps and if there are, request a garrison and signal all creeps to flee to origin room
            let targetRoom = Game.rooms[this.memory.targetRoom];
            if (targetRoom) {
                let hostileCreeps = Game.rooms[this.room].find(FIND_HOSTILE_CREEPS, {
                    filter: function(object) {
                        return object.getActiveBodyparts(ATTACK) > 0 || object.getActiveBodyparts(RANGED_ATTACK) > 0
                    }
                });
                //todo: check for attack parts?
                if (hostileCreeps.length > 0) {
                    this.getExecutive().spawnGarrison(this.memory.targetRoom);
                    this.flee();
                    return true;
                }
            }
        }

        //if we get here, we are not fleeing
        this.fleeing = false;
        return false;
    }

    /**
     * Method to move the combat creep to their assigned room
     * @param {RoomObject} targetRoom room to march towards
     */
    march(targetRoom = this.targetRoom, offRoad = false) {
        let options = {
            ensurePath: true,
            offRoad: offRoad
        };
        if (["developer", "emissary"].includes(this.memory.type)) {
            options["preferHighway"] = true;
        }
            
        this.liveObj.travelTo(new RoomPosition(25,25, targetRoom), options);

        if (this.room == targetRoom) this.arrived = true;
    }

    /**
     * Method to flee to origin room when enemies are detected
     */
    flee() {
        this.fleeing = true;
        this.arrived = false;
        let position = new RoomPosition(25,25, this.memory.spawnRoom);
        if (!this.pos.inRangeTo(position, 15)) {
            this.liveObj.moveTo(position);
        }
    }
}

module.exports = Remotus;