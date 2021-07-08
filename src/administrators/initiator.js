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
    initiate(template, rebirth=false) {
        //! checking to see if success != OK will cause a bug when multiple spawns are queued in the same tick. It will erase them.
        let originator = this.getOriginator();
        //to make sure that we actually find a nexus that can spawn this request.
        let foundNexus = false;
        //loop through the spawns until an available one is found
        for (let nexus of originator.constructs["nexus"]) {
            if (!nexus.spawning && !nexus.spawningThisTick) {
                foundNexus = true;
                //! these seem to be failing
                if (rebirth) {
                    if (!template.memory.generation) {
                        template.memory.generation = 0
                    }
                    template.memory.generation++;
                }
                let success = nexus.spawnCreep(template.body, template.type, {...template.memory});

                //if the request fails, schedule it for 20 ticks in the future
                if (success != OK) {
                    //so we can reschedule
                    foundNexus = false;
                }
            } 
        }

        if (!foundNexus) {
            let task = "global.Imperator.administrators[objArr[1].room].initiator.initiate(objArr[0]);";
            global.Executive.schedule(Game.time + 20, task, [{...template}, this]);
        } 
        

        if (rebirth) {
            this.dismiss(template);
        }
    }

    /**
     * Delete the class holding the dead creep
     * @param {Proletarian} proletarian 
     */
    dismiss(proletarianType) {
        //If the creep is replacing a dead creep, we delete it from memory
        let originator = this.getOriginator();
        let origArr = originator.proletarian[proletarianType.type];
        let index = origArr.indexOf(proletarianType);
        if (index >= 0) origArr.splice(index, 1);
        //todo: we can use the absence of this to see when we missed a creep due to global reset
        delete Memory.creeps[proletarianType.memory.name];
    }

    /**
     * Function to get the room's originator
     * @returns Originator
     */
    getOriginator() {
        return global.Imperator.administrators[this.room].originator;
    }

    /**
     * Initialize spawning for phase one rooms
     * Phase one is defined as RCL 1-3
     */
    phaseOne() {
        //I think 5 engineers is a good starting point
        for (var i = 0; i < 5; i++) {
            //todo: Figure out a way to terminate these tasks once we finish phaseOne
            let memory = {"generation" : 0}
            let task = "global.Imperator.administrators[objArr[0].room].initiator.initiate({'body' : [WORK, CARRY, MOVE, MOVE], 'type': 'engineer', 'memory': objArr[1]});";
            global.Executive.schedule(Game.time + (i * 10), task, [this, memory]);
        }
    }
}

module.exports = Initiator;