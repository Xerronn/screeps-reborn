const Worker = require('./worker');;

//creep that draws from the storage and builds buildings
class Contractor extends Worker {
    constructor(creepId) {
        super(creepId);
    }

    /**
     * Logic to run every tick
     */
    run () {
        if (this.store.getUsedCapacity(RESOURCE_ENERGY) == 0 || (this.memory.task == "withdraw" && this.store.getFreeCapacity(RESOURCE_ENERGY) > 0)) {
            this.memory.task = "withdraw";
            this.withdrawStorage();
        } else if (Game.rooms[this.room].find(FIND_MY_CONSTRUCTION_SITES).length > 0) {
            this.memory.task = "build";
            this.build();
        } else {
            if (this.memory.generation != undefined) {
                this.conclude();
            }
            this.upgradeController();
        }
    }

    /**
     * build construction sites closest to storage
     */
    build() {
        let storage = Game.rooms[this.room].storage;
        let liveClosestSite = Game.getObjectById(this.memory.closestSite);
        
        if (!liveClosestSite) {
            global.Imperator.administrators[this.room].originator.initialize(true);
            let sites = Game.rooms[this.room].find(FIND_MY_CONSTRUCTION_SITES);

            liveClosestSite = storage.pos.findClosestByRange(sites);
            this.memory.closestSite = liveClosestSite.id;
        }

        if (this.pos.inRangeTo(liveClosestSite, 1)) {
            this.liveObj.build(liveClosestSite);
        } else {
            this.liveObj.moveTo(liveClosestSite);
        }
    }

    /**
     * Method to remove rebirth and lower archivist contractor count
     */
    conclude() {
        //lower count by one
        global.Archivist.setNumContractors(this.room, global.Archivist.getNumContractors(this.room) - 1);
        delete this.memory.generation;
    }
}

module.exports = Contractor;