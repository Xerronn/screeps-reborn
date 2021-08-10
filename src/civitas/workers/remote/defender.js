const Remotus = require("./remotus");

//remote defender class definition
class Defender extends Remotus {
    constructor(creepId) {
        super(creepId);

        this.update(true);
    }

    run() {
        if (!this.arrived) {
            this.march()
            return;
        }

        this.kill();
        this.heal();
    }
    kill() {
        let enemies = Game.rooms[this.room].find(FIND_HOSTILE_CREEPS);

        if (enemies.length > 0) {
            this.target = enemies[0];

            if (this.pos.inRangeTo(this.target, 1)) {
                this.liveObj.attack(this.target);
            } else {
                this.liveObj.moveTo(this.target);
            }
        }
    }

    heal() {
        if (!this.target && this.hits < this.hitsMax) {
            this.liveObj.heal(this.liveObj);
        }
    }
}

module.exports = Defender;