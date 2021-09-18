const Legionnaire = require("./legionnaire");

//room killer; a creep so powerful it can single handedly destroy lower rcl rooms
class Executioner extends Legionnaire {
    constructor(creepId) {
        super(creepId);

        this.update(true);
    }

    run() {
        if (this.memory.boost !== undefined && this.ticksToLive > 1400) {
            if (this.boost(this.memory.boost)) return;
            delete this.memory.boost;
        }

        this.selfHeal(); //self heal no matter what
        if (this.memory.task === 'killInvader') {
            //march to target room
            if (this.room !== this.memory.targetRoom) {
                this.liveObj.travelTo(new RoomPosition(25,25, this.targetRoom), {preferHighway:true});
                return true;
            } else {
                this.acquireTarget();

                if (this.target && this.target !== 'none') {
                    this.melee();
                } else if (this.ticksToLive < 1400){
                    delete this.memory.generation;
                    global.Archivist.setGarrisonSpawned(this.memory.spawnRoom, false);
                    this.liveObj.suicide();
                }
            }
        }
        //march to target room
        if (this.room !== this.memory.targetRoom || !this.target) {
            this.liveObj.travelTo(new RoomPosition(25,25, this.targetRoom), {preferHighway:true});
            return true;
        }

        if (this.target) {
            this.ranged();
        } 
    }

    /**
     * Method to acquire an attack target
     */
    acquireTarget() {
        if (this.memory.task == "killInvader") {
            let targets = Game.rooms[this.room].find(FIND_HOSTILE_STRUCTURES, {
                filter: {structureType: STRUCTURE_INVADER_CORE}
            });
            if (targets && targets[0]) {
                this.memory.target = targets[0].id;
            } else this.memory.target = 'none';
        } else {
            let targets = Game.rooms[this.room].find(FIND_HOSTILE_CREEPS, {
                filter: function(object) {
                    return object.getActiveBodyparts(ATTACK) > 0 || object.getActiveBodyparts(RANGED_ATTACK) > 0;
                }
            });
            if (!targets || targets.length == 0) {
                targets = Game.rooms[this.room].find(FIND_HOSTILE_STRUCTURES, {filter: {structureType: STRUCTURE_TOWER}});
            }
            if (!targets || targets.length == 0) {
                targets = Game.rooms[this.room].find(FIND_HOSTILE_SPAWNS);
            }
            if (!targets || targets.length == 0) {
                targets = Game.rooms[this.room].find(FIND_HOSTILE_STRUCTURES);
            }
            if (targets && targets.length > 0) {
                this.target = this.pos.findClosestByRange(targets);
                this.memory.target = this.target.id;
            } else this.memory.target = "none";
        }
    }
}

module.exports = Executioner;