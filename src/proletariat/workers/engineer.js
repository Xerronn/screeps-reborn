const Worker = require("./worker");

//creep tasked with early colony management.
//get energy in any way possible and lay the foundations
//used until rc3

//creep tasked with harvesting sources
class Engineer extends Worker {
    constructor(creepId) {
        super(creepId);
        
    }

    update(force) {
        if (this.updateTick != Game.time || force == true) {
            if (!super.update(force)) {
                //creep is dead
                return false;
            }
            //any attributes to update
        }
        return true;
    }

    run() {
        //determine if the room needs emergency upgrading
        let roomController = Game.rooms[this.room].controller;
        if (roomController.ticksToDowngrade < CONTROLLER_DOWNGRADE[roomController.level] / 10) {
            this.memory.task = "emergencyUpgrade";
        }

        //emergency upgrader
        if (this.memory.task == "emergencyUpgrade") {
            if (roomController.ticksToDowngrade == CONTROLLER_DOWNGRADE[roomController.level]) {
                this.memory.task = "harvest";
            } else {
                this.upgradeController();
                return;
            }
        }

        //good priorities up to rcl 4, where engineers will begin to be phased out
        if (this.store.getUsedCapacity(RESOURCE_ENERGY) == 0 || (this.memory.task == "harvest" && this.store.getFreeCapacity(RESOURCE_ENERGY) > 0)) {
            this.memory.task = "harvest";
        } else if (!global.Archivist.getTowersFilled(this.room)) {
            this.memory.task = "fillTowers";
        } else if (!global.Archivist.getExtensionsFilled(this.room)) {
            this.memory.task = "fillExtensions";
        } else if (Game.rooms[this.room].find(FIND_MY_CONSTRUCTION_SITES).length > 0) {
            this.memory.task = "build";
        } else {
            this.memory.task = "upgradeController";
        }

        let task = "this." + this.memory.task + "();"
        eval(task);
    }

    /**
     * Overriden build method that finds nearest to assigned source instead of position
     */
    build() {
        let liveClosestSite = Game.getObjectById(this.memory.closestSite);
        
        if (!liveClosestSite) {
            let sites = Game.rooms[this.room].find(FIND_MY_CONSTRUCTION_SITES);

            liveClosestSite = this.source.pos.findClosestByRange(sites);
            this.memory.closestSite = liveClosestSite.id;
        }

        if (this.pos.inRangeTo(liveClosestSite, 1)) {
            this.liveObj.build(liveClosestSite);
        } else {
            this.liveObj.moveTo(liveClosestSite);
        }
    }
}

module.exports = Engineer;