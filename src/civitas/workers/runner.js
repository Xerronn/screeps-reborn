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

        if (Game.rooms[this.room].energyAvailable < global.Illustrator.calculateBodyCost(this.memory.body) && this.memory.task == "renewFill") {
            if (this.store.getUsedCapacity(RESOURCE_ENERGY) == 0) {
                this.withdrawStorage();
            } else {
                this.fillExtensions();
            }
            return;
        }

        if (this.evolve() && this.memory.task == "renewFill") {
            return; //if evolving, just stop here
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
     * @returns {boolean} if the creep is evolving
     */
    evolve() {
        let controllerLevel = Game.rooms[this.room].controller.level;
        if (controllerLevel % 2 == 1) {
            //lower the controller level to nearest even number
            //for a good move:carry ratio
            controllerLevel--;
        }

        //count carry parts in current body
        let carryCount = 0;
        for (let part of this.body) {
            if (part == CARRY) {
                carryCount++;
            }
        }

        //if the carry count is lower than the controllerLevel, upgrade body
        if (carryCount < controllerLevel) {
            let newBody = this.body;
            for (let i = 0; i < controllerLevel; i++) {
                newBody.unshift(CARRY)
                newBody.push(MOVE);
            }

            this.memory.body = newBody;
            this.memory.task = "withdraw";
            //the runner will never die without it suiciding, so it has to be done
            this.liveObj.suicide();
            return true;
        }
        return false;
    }
}

module.exports = Runner;