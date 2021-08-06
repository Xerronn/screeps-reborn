const Worker = require("./worker");

//creep that fills up extensions and towers
class Runner extends Worker {
    constructor(creepId) {
        super(creepId)
    }

    run() {
        if (this.ticksToLive < 300 || this.memory.task == "renew" || this.memory.task == "renewFill") {
            //start the loop by setting task to rewnewFill
            //this task will block spawning, but keep filling 
            //until reaching the required energy for a full renew
            if (this.memory.task != "renew") {
                this.memory.task = "renewFill";
            }
            this.renew();
        } else if (this.store.getUsedCapacity(RESOURCE_ENERGY) == 0 || (this.memory.task == "withdraw" && this.store.getFreeCapacity(RESOURCE_ENERGY) > 0)) {
            this.memory.task = "withdraw";
            this.withdrawStorage();
        } else if (!global.Archivist.getTowersFilled(this.room)) {
            this.memory.task = "fillTowers";
            this.fillTowers();
        } else if (!global.Archivist.getExtensionsFilled(this.room)) {
            this.memory.task = "fillExtensions";
            this.fillExtensions();
        }
    }

    /**
     * Method to get the creep to renew itself to help prevent softlocks
     */
    renew() {
        //check if a nexus is cached
        let nexus = global.Illustrator.getWrapper(this.memory.closestSpawn);

        //if not, assign the closest spawn to the storage to renew this creep
        if (!nexus) {
            let allSpawns = global.Archivist.getStructures(this.room, STRUCTURE_SPAWN);
            let closestSpawn = Game.rooms[this.room].storage.pos.findClosestByRange(allSpawns)
            this.memory.closestSpawn = closestSpawn.id;
            nexus = global.Illuminator.getWrapper(this.memory.closestSpawn);
        }

        //reserve the spawn, then renew until its full or no energy left
        nexus.reserve();

        if (Game.rooms[this.room].energyAvailable < 300 && this.memory.task == "renewFill") {
            if (this.store.getUsedCapacity(RESOURCE_ENERGY) == 0) {
                this.withdrawStorage();
            } else {
                this.fillExtensions();
            }
            return;
        }

        //if we get to this point, energyAvailable is > 300, so we can set task to just renew fully
        this.memory.task = "renew";

        if (!nexus.spawning) {
            if (this.pos.inRangeTo(nexus.liveObj, 1)) {
                nexus.liveObj.renewCreep(this.liveObj);
            } else {
                this.liveObj.moveTo(nexus.liveObj);
            }
        }

        //once ticks to live is high enough we can break out of the loop
        if (this.ticksToLive > 1300 || Game.rooms[this.room].energyAvailable < 30) {
            this.memory.task = "none";
        }
    }

    /**
     * Method to make the creep stronger to meet higher demands
     */
    evolve() {
        let controllerLevel = Game.rooms[this.room].controller.level;
        let newBody = [];

        for (let i = 0; i++; i< controllerLevel) {
            newBody.unshift(CARRY)
            newBody.push(MOVE);
        }

        if (this.memory.body.length != newBody.length) {
            this.memory.body = newbody;
            //the runner will never die without it suiciding, so it has to be done
            this.liveObj.suicide();
        }
    }
}

module.exports = Runner;