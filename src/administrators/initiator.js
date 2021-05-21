//entity that manages creep spawning
class Initiator {
    constructor() {
    }

    /**
     * Function that takes a creep object and makes a new creep based on that object
     * @param {Proletarian} deadCreep
     */
    initiate(deadCreep=null) {
        if (deadCreep) {
            let originator = global.Imperator.originators[deadCreep.room];
            //loop through the spawns until an available one is found
            for (var nexus of originator.constructs["nexus"]) {
                if (!nexus.spawning) {
                    console.log(nexus.spawnCreep(deadCreep.body, deadCreep.type));
                    break;
                }
            }

            //lastly, remove the object referencing the dead creep and memory object
            let origArr = originator.proletarian[deadCreep.type];
            let index = origArr.indexOf(deadCreep);
            origArr.splice(index, 1);
            //todo: we can use the absence of this to see when we missed a creep due to global reset
            delete Memory.creeps[deadCreep.name];
        }
    }
}

module.exports = Initiator;