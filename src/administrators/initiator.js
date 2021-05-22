//entity that manages creep spawning
class Initiator {
    constructor(room) {
        this.room = room;
    }

    /**
     * Function that takes a creep object and makes a new creep based on that object
     * @param {Object} template An object that contains body, type, and memory
     * @param {boolean} rebirth whether or not this is a rebirth
     */
    initiate(template=null, rebirth=false) {
        if (template) {
            //this could be a property, but initialization could get weird. Easier to keep it like this
            let originator = global.Imperator.administrators[this.room].originator;
            //loop through the spawns until an available one is found
            for (var nexus of originator.constructs["nexus"]) {
                if (!nexus.spawning) {
                    let success = nexus.spawnCreep(template.body, template.type, template.memory);

                    //if the request fails, schedule it for 20 ticks in the future
                    if ([ERR_NOT_ENOUGH_ENERGY, ERR_BUSY].includes(success)) {
                        let task = "global.Imperator.administrators[objArr[1].room].initiator.initiate(objArr[0]);";
                        global.Executive.schedule(Game.time + 20, task, [template, this]);
                    }
                    break;
                }
            }

            if (rebirth) {
                //If the creep is replacing a dead creep, we delete it from memory
                let origArr = originator.proletarian[template.type];
                let index = origArr.indexOf(template);
                origArr.splice(index, 1);
                //todo: we can use the absence of this to see when we missed a creep due to global reset
                delete Memory.creeps[template.name];
            }
        }
    }

    /**
     * Initialize spawning for phase one rooms
     * Phase one is defined as RCL 1-3
     */
    phaseOne() {
        //I think 5 engineers is a good starting point
        for (var i = 0; i < 5; i++) {
            //todo: Figure out a way to terminate these tasks once we finish phaseOne
            //! these tasks are not being looped back around like they should. Figure out why
            let task = "global.Imperator.administrators[objArr[0].room].initiator.initiate({'body' : [WORK, CARRY, CARRY, MOVE], 'type': 'engineer', 'memory': null});";
            global.Executive.schedule(Game.time + (i * 10), task, [this]);
        }
    }
}

module.exports = Initiator;