const Worker = require("./worker");

//creep tasked with early colony management.
//get energy in any way possible and lay the foundations
//used until rc3

//creep tasked with harvesting sources
class Engineer extends Worker {
    constructor(creepId) {
        super(creepId);
        this.noPillage = false;
        
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
            if (!this.noPillage) {
                if (this.pillage()) return;
            }
            this.harvest();
        } else if (!global.Archivist.getTowersFilled(this.room)) {
            this.memory.task = "fillTowers";
            this.fillTowers();
        } else if (!global.Archivist.getExtensionsFilled(this.room)) {
            this.memory.task = "fillExtensions";
            this.fillExtensions();
        } else if (Game.rooms[this.room].find(FIND_MY_CONSTRUCTION_SITES).length > 0) {
            this.memory.task = "build";
            this.build();
        } else {
            this.memory.task = "upgradeController";
            this.upgradeController();
        }

        //evolve the creep to meet expanding energy availability
        if (this.ticksToLive < 2) {
            this.evolve();
        }
    }

    /**
     * Overriden build method that finds nearest to assigned source instead of position
     */
    build() {
        let liveClosestSite = Game.getObjectById(this.memory.closestSite);
        
        if (!liveClosestSite) {
            this.getSupervisor().wrap(true);
            let sites = Game.rooms[this.room].find(FIND_MY_CONSTRUCTION_SITES);

            liveClosestSite = this.source.pos.findClosestByRange(sites);
            this.memory.closestSite = liveClosestSite.id;
        }

        if (this.pos.inRangeTo(liveClosestSite, 3)) {
            this.liveObj.build(liveClosestSite);
        } else {
            this.liveObj.moveTo(liveClosestSite);
        }
    }

    /**
     * Method to evolve the engineer as more extensions are built
     */
    evolve() {
        if (Game.rooms[this.room].energyCapacityAvailable >= 500) {
            this.memory.body = [
                WORK, WORK, 
                CARRY, CARRY, 
                MOVE, MOVE, MOVE, MOVE
            ];
        }
        if (Game.rooms[this.room].energyCapacityAvailable >= 750) {
            this.memory.body = [
                WORK, WORK, WORK, 
                CARRY, CARRY, CARRY, 
                MOVE, MOVE, MOVE, MOVE, MOVE, MOVE
            ];
        }
        if (Game.rooms[this.room].energyCapacityAvailable >= 1000) {
            this.memory.body = [
                WORK, WORK, WORK, WORK, 
                CARRY, CARRY, CARRY, CARRY, 
                MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE
            ];
        }
    }
}

module.exports = Engineer;