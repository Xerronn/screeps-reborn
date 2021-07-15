const Worker = require("./worker");

//creep tasked with early colony management.
//get energy in any way possible and lay the foundations
//used until rc3

//creep tasked with harvesting sources
class Engineer extends Worker {
    constructor(creepId) {
        super(creepId);
        
    }

    run() {
        if (this.store.getUsedCapacity(RESOURCE_ENERGY) == 0 || (this.memory.task == "harvest" && this.store.getFreeCapacity(RESOURCE_ENERGY) > 0)) {
            this.memory.task = "harvest";
        } else if (!global.Archivist.getExtensionsFilled(this.room)) {
            this.memory.task = "fillExtensions";
        } else if (global.Archivist.getStructures(this.room, "constructionSite").length > 0) {
            this.memory.task = "buildNearest";
        } else {
            this.memory.task = "upgradeController";
        }
        //todo building

        let task = "this." + this.memory.task + "();"
        eval(task);
    }
}

module.exports = Engineer;