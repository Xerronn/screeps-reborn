//entity that manages creep spawning
class Initiator {
    constructor(room) {
        this.room = room;
    }

    /**
     * Function that takes a creep object and makes a new creep based on that object
     * @param {Proletarian} template
     */
    initiate(template=null, isDead=false) {
        if (template) {
            let originator = global.Imperator.administrators[template.room].originator;
            //loop through the spawns until an available one is found
            for (var nexus of originator.constructs["nexus"]) {
                if (!nexus.spawning) {
                    let success = nexus.spawnCreep(template.body, template.type, template.memory);

                    //if the request fails, schedule it for sometime in the future
                    if ([ERR_NOT_ENOUGH_ENERGY, ERR_BUSY].includes(success)) {
                        let task = "global.Imperator.administrators[objArr[0].room].initiator.initiate(objArr[0]);"
                        global.Executive.schedule(Game.time + 20, task, [template]);
                    }
                    break;
                }
            }

            if (isDead == true) {
                //If the creep is replacing a dead creep, we delete it from memory
                let origArr = originator.proletarian[template.type];
                let index = origArr.indexOf(template);
                origArr.splice(index, 1);
                //todo: we can use the absence of this to see when we missed a creep due to global reset
                delete Memory.creeps[template.name];
            }
        }
    }
}

module.exports = Initiator;