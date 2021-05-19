const Archon = require("../proletariat/archon");

//entity that initializes and refreshes our objects
class Originator {
    constructor() {
        this.proletariats = {};
        this.constructs = {};
        this.initialize();
    }

    initialize() {
        //initialize all creeps to their respective classes
        for (var name in Game.creeps) {
            var creep = Game.creeps[name];
            switch (creep.memory.type) {
                case "archon":
                    //init the list in the dictionary if it doesn't exist
                    !("archon" in this.proletariats) && (this.proletariats["archon"] = {});
                    this.proletariats["archon"].push(new Archon(creep.id));
                    break;
            }
        }
        //initialize all structures to their respective classes
    }

    refresh() {
        //refresh the live game object reference for every object we have
        for (var type of Object.keys(this.proletariats)) {
            for (var pro of this.proletariats[type]) {
                pro.update();
            }
        }
    }
}

module.exports = Originator;