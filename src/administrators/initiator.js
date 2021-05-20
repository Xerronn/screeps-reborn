
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
            //lastly, remove the object referencing the dead creep
            let origArr = global.Imperator.originators[deadCreep.room].proletarian[deadCreep.type];
            let index = origArr.indexOf(deadCreep);
            origArr.splice(index, 1)
        }
    }
}

module.exports = Initiator;