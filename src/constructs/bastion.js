const Construct = require("./construct");

//tower entity
class Bastion extends Construct {
    constructor(towerId) {
        super(towerId);

    }

    run() {
        //set tower filled flag
        if (this.store.getFreeCapacity(RESOURCE_ENERGY) > this.store.getCapacity(RESOURCE_ENERGY) / 4) {
            global.Archivist.setTowersFilled(this.room, false);
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
        let roads = global.Archivist.getStructures(this.room, STRUCTURE_ROAD);
        let containers = global.Archivist.getStructures(this.room, STRUCTURE_CONTAINER);
        
        let repairables = roads.concat(containers).filter(
            obj => obj.hits < obj.hitsMax
        );
        
        //might be a bit cpu intensive, shouldn't be really necessary for now
        //let target =  _.sortBy(repairables, (struc) => struc.hits/struc.hitsMax)[0];
        let target = repairables[0];

        if (target && this.store.getUsedCapacity(RESOURCE_ENERGY) > 250) {
            this.liveObj.repair(target);
        }
    }
}

module.exports = Bastion;