const Legionnaire = require("./legionnaire");

//remote defender class definition
class Garrison extends Legionnaire {
    constructor(creepId) {
        super(creepId);

        this.update(true);
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

        if (this.hits <= this.hitsMax - 300 || this.hits < this.hitsMax && this.memory.task == "selfHeal") {
            this.memory.task = "selfHeal";
            this.selfHeal();
        }
    }
}

module.exports = Garrison;