const Legionnaire = require("./legionnaire");

//remote harass creep for remotes
class Jester extends Legionnaire {
    constructor(creepId) {
        super(creepId);

        this.update(true);
    }

    run() {
        //march to target room
        if (this.room !== this.memory.targetRoom || !this.target) {
            this.liveObj.travelTo(new RoomPosition(25,25, this.targetRoom), {preferHighway:true});
            return true;
        }
        if (!this.memory.travelTime) this.memory.travelTime = 1500 - this.ticksToLive;

        if (this.target && this.target.pos.x > 1 && this.target.pos.x < 48 && this.target.pos.y > 1 && this.target.pos.y < 48) {
            this.melee();
        } else {
            this.acquireTarget();
        }

        if (this.memory.generation !== undefined && this.ticksToLive <= this.memory.travelTime + 100) {
            this.getSupervisor().initiate({
                'body': [...this.body],
                'type': this.memory.type,
                'memory': {...this.memory}
            });

            //no more rebirth for you
            delete this.memory.generation;
        }
    }

    /**
     * Method to acquire an attack target
     */
    acquireTarget() {
        let targets = Game.rooms[this.room].find(FIND_HOSTILE_CREEPS, {
            filter: function(object) {
                return object.getActiveBodyparts(ATTACK) == 0;
            }
        });
        if (targets && targets.length > 0) {
            this.target = this.pos.findClosestByRange(targets);
            this.memory.target = this.target.id;
        } else this.memory.target = "none";
    }
}

module.exports = Jester;