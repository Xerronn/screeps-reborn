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
        console.log(this.store.getUsedCapacity(RESOURCE_ENERGY));
        if (this.store.getUsedCapacity(RESOURCE_ENERGY) == 0 || (this.memory.task == "harvest" && this.store.getFreeCapacity(RESOURCE_ENERGY) > 0)) {
            this.memory.task = "harvest";
        } else if (this.store.getFreeCapacity(RESOURCE_ENERGY) == 0 && !Memory.rooms[this.room].extensionsFilled) {
            this.memory.task = "fillExtensions";
        } else {
            this.memory.task = "upgradeController";
        }
        //todo building

        let task = "this." + this.memory.task + "();"
        eval(task);
    }
}

module.exports = Engineer;