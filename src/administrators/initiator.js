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
        //! checking to see if success != OK will cause a bug when multiple spawns are queued in the same tick. It will erase them.
        if (template) {
            //this could be a property, but initialization could get weird. Easier to keep it like this
            let originator = global.Imperator.administrators[this.room].originator;
            //loop through the spawns until an available one is found
            for (let nexus of originator.constructs["nexus"]) {
                if (!nexus.spawning) {
                    let success = nexus.spawnCreep(template.body, template.type, {...template.memory});

                    //if the request fails, schedule it for 20 ticks in the future
                    if (success != OK) {
                        let task = "global.Imperator.administrators[objArr[1].room].initiator.initiate(objArr[0]);";
                        global.Executive.schedule(Game.time + 20, task, [{...template}, this]);
                    }
                }
            }

            if (rebirth) {
                //If the creep is replacing a dead creep, we delete it from memory
                let origArr = originator.proletarian[template.type];
                let index = origArr.indexOf(template);
                if (index >= 0) origArr.splice(index, 1);
                //todo: we can use the absence of this to see when we missed a creep due to global reset
                console.log(template.memory.name);
                delete Memory.creeps[template.memory.name];
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
            let task = "global.Imperator.administrators[objArr[0].room].initiator.initiate({'body' : [WORK, CARRY, CARRY, MOVE], 'type': 'engineer', 'memory': null});";
            global.Executive.schedule(Game.time + (i * 10), task, [this]);
        }
    }
}

module.exports = Initiator;