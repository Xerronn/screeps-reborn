const Castrum = require("./castrum");

//tower entity
class Bastion extends Castrum {
    constructor(towerId) {
        super(towerId);

        this.repairTargets = [];
    }
    //todo: heal creeps in room that are damaged
    run() {
        //set tower filled flag
        if (this.store.getFreeCapacity(RESOURCE_ENERGY) > this.store.getCapacity(RESOURCE_ENERGY) / 4) {
            global.Archivist.setTowersFilled(this.room, false);
        }

        //find new repair targets every 15 ticks
        if (Game.time % 15) {
            this.findRepairTargets();
        }

        if (!this.simpleAttack()) {
            this.repair();
        }
        
    }

    /**
     * Simple attack method attacking the closest enemy
     * @returns if tower is attacking
     */
    simpleAttack() {
        var closestHostile = this.pos.findClosestByRange(FIND_HOSTILE_CREEPS);
        if(closestHostile) {
            this.liveObj.attack(closestHostile);
            return true;
        }
        return false;
    }

    repair() {
        let target = undefined;
        let tempTargets = [...this.repairTargets];

        let index = 0;
        for (let id of tempTargets) {
            let liveObj = Game.getObjectById(id)
            if (!liveObj) continue;
            if (liveObj.hits < liveObj.hitsMax) {
                target = liveObj;
                break;
            } else {
                this.repairTargets.splice(index, 1);
                index++;
            }
        }

        if (target && this.store.getUsedCapacity(RESOURCE_ENERGY) > 250) {
            this.liveObj.repair(target);
        }
    }

    findRepairTargets() {
        //erase old repairTargets
        this.repairTargets = [];

        let roads = global.Archivist.getStructures(this.room, STRUCTURE_ROAD);
        let containers = global.Archivist.getStructures(this.room, STRUCTURE_CONTAINER);
        
        let repairables = roads.concat(containers).filter(function(obj) {
            if (obj) {
                return obj.hits < obj.hitsMax;
            } else return false;
        });

        let sortedRepairables = _.sortBy(repairables, (struc) => struc.hits/struc.hitsMax).map(obj => obj.id);
        this.repairTargets = sortedRepairables;
    }
}

module.exports = Bastion;