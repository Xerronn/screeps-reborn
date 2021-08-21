const Remotus = require("./remotus");

//class definition for a remote repairer
class Curator extends Remotus {
    constructor(creepId) {
        super(creepId);
    }

    run() {
        //march to room and flee if enemies
        if (super.run()) return;

        //steal from one of the two containers
        if (this.store.getUsedCapacity(RESOURCE_ENERGY) == 0 || (this.memory.task == "withdraw" && this.store.getFreeCapacity(RESOURCE_ENERGY) > 0)) {
            this.memory.task = "withdraw";
            this.withdrawContainer();
        } else {
            this.memory.task = "repair"
            this.repairRoads();
        }
    }


    /**
     * Function that repairs all structures in a room
     */
    repairRoads() {
        let liveClosestRoad = Game.getObjectById(this.memory.closestRoad);
        
        if (!liveClosestRoad || liveClosestRoad.hits == liveClosestRoad.hitsMax) {
            let allRoads = Game.rooms[this.room].find(
                FIND_STRUCTURES, 
                {filter: (struc) => struc.structureType == STRUCTURE_ROAD && struc.hits < struc.hitsMax / (25/23)}
            );
            if (allRoads.length == 0){
                this.conclude();
            }
            liveClosestRoad = this.pos.findClosestByRange(allRoads);
            this.memory.closestRoad = liveClosestRoad.id;
        }

        if (this.pos.inRangeTo(liveClosestRoad, 3)) {
            this.liveObj.repair(liveClosestRoad);
        } else {
            this.liveObj.moveTo(liveClosestRoad);
        }
    }

    /**
     * Method that finds nearest container and withdraws from it
     */
    withdrawContainer() {
        let liveClosestContainer = Game.getObjectById(this.memory.closestContainer);
        
        if (!liveClosestContainer) {
            let allContainers = Game.rooms[this.room].find(
                FIND_STRUCTURES, 
                {filter: {structureType: STRUCTURE_CONTAINER}}
            );

            liveClosestContainer = this.pos.findClosestByRange(allContainers);

            if (liveClosestContainer) {
                this.memory.closestContainer = liveClosestContainer.id;
            } else return;
        }

        if (this.pos.inRangeTo(liveClosestContainer, 1)) {
            if (liveClosestContainer.store.getUsedCapacity(RESOURCE_ENERGY) > this.store.getFreeCapacity(RESOURCE_ENERGY)) {
                this.liveObj.withdraw(liveClosestContainer, RESOURCE_ENERGY);
                delete this.memory.closestContainer;
            }
        } else {
            this.liveObj.moveTo(liveClosestContainer);
        }
    }

    /**
     * Method to retire the repairer without rebirth
     */
    conclude() {
        delete this.memory.generation;
        global.Archivist.setCuratorSpawned(this.memory.spawnRoom, false);
        this.liveObj.suicide();
    }
}

module.exports = Curator;