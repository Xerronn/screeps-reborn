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
        //determine if 
        let roomController = Game.rooms[this.room].controller;
        if (roomController.ticksToDowngrade < CONTROLLER_DOWNGRADE[roomController.level] / 10) {
            this.memory.task = "emergencyUpgrade";
        } else if (roomController.ticksToDowngrade == CONTROLLER_DOWNGRADE[roomController.level]) {
            this.memory.task = "harvest";
        }

        //emergency upgrader
        if (this.memory.task == "emergencyUpgrade") {
            this.upgradeController();
            return;
        }

        //good priorities up to rcl 3, where engineers will begin to be phased out
        if (this.store.getUsedCapacity(RESOURCE_ENERGY) == 0 || (this.memory.task == "harvest" && this.store.getFreeCapacity(RESOURCE_ENERGY) > 0)) {
            this.memory.task = "harvest";
        } else if (!global.Archivist.getExtensionsFilled(this.room)) {
            this.memory.task = "fillExtensions";
        } else if (Game.rooms[this.room].find(FIND_MY_CONSTRUCTION_SITES).length > 0) {
            this.memory.task = "buildNearest";
        } else {
            this.memory.task = "upgradeController";
        }

        let task = "this." + this.memory.task + "();"
        eval(task);
    }
}

module.exports = Engineer;