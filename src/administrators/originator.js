const Archon = require("../proletariat/archon");
const Nexus = require("../constructs/nexus");

//entity that initializes and refreshes our objects every tick
class Originator {
    constructor() {
        this.proletarian = {};
        this.constructs = {};
        this.initialize();
    }

    initialize() {
        //initialize all creeps to their respective classes
        for (var name in Game.creeps) {
            var creep = Game.creeps[name];
            switch(creep.memory.type) {
                case "archon":
                    //init the list in the dictionary if it doesn't exist
                    !("archon" in this.proletarian) && (this.proletarian["archon"] = []);
                    this.proletarian["archon"].push(new Archon(creep.id));
                    break;
            }
        }

        //initialize all structures to their respective classes
        for (var id of Object.keys(Game.structures)) {
            var struc = Game.structures[id];
            switch(struc.structureType) {
                case STRUCTURE_SPAWN:
                    //init the list in the dictionary if it doesn't exist
                    !("nexus" in this.constructs) && (this.constructs["nexus"] = []);
                    this.constructs["nexus"].push(new Nexus(struc.id));
                    break;
            }
        }
        console.log("done")
    }

    refresh() {
        //refresh the live game object reference for every creep
        for (var type of Object.keys(this.proletarian)) {
            for (var pro of this.proletarian[type]) {
                pro.update();
            }
        }

        //refresh the live game object reference for every structure
        for (var type of Object.keys(this.constructs)) {
            for (var struc of this.constructs[type]) {
                struc.update();
            }
        }
    }
}

module.exports = Originator;