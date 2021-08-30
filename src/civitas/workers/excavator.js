const Civitas = require("../civitas");

//mineral miner creep class definition
class Excavator extends Civitas {
    constructor(creepId) {
        super(creepId);
        
        if (!this.memory.mineral) {
            this.memory.mineral = Game.rooms[this.room].find(FIND_MINERALS)[0].id;
        }
        if (!this.memory.extractor) {
            this.memory.extractor = Game.rooms[this.room].find(FIND_STRUCTURES, {filter: {structureType : STRUCTURE_EXTRACTOR}})[0].id;

        }
        
        this.update(true);
    }

    update(force) {
        if (this.updateTick != Game.time || force == true) {
            if (!super.update(force)) {
                //creep is dead
                return false;
            }
            //any attributes to update

            if (this.memory.mineral) {
                this.mineral = Game.getObjectById(this.memory.mineral);
            }
            if (this.memory.extractor) {
                this.extractor = Game.getObjectById(this.memory.extractor);
            }

            if (!this.memory.container && this.mineral) {
                let allContainers = global.Archivist.getStructures(this.room, STRUCTURE_CONTAINER);
                let container = this.mineral.pos.findInRange(allContainers, 1)[0];
                if (container) {
                    this.memory.container = container.id
                    this.container = Game.getObjectById(this.memory.container);
                }
            } else {
                this.container = Game.getObjectById(this.memory.container);
            }
        }
        return true;
    }

    run() {
        //when the mineral is empty, do nothing until death.
        //premature suicide leaves energy in the container
        if (this.memory.generation == undefined) return;

        this.harvest();

        if (this.container.store.getUsedCapacity() > 1500 && !this.memory.courierSpawned) {
            this.spawnCourier();
        }

        // this mineral courier will not rebirth due to it not being spawned very often
        if (this.memory.courierSpawned && this.container.store.getUsedCapacity() < 1000) {
            this.memory.courierSpawned = false;
        }

        //spawn a new excavator when the mineral is regenerated
        if (this.memory.generation !== undefined && this.mineral.mineralAmount == 0 && this.mineral.ticksToRegeneration && this.ticksToLive < this.mineral.ticksToRegeneration) {

            let task = `
                global.Imperator.administrators[\"` + this.memory.spawnRoom + `\"].supervisor.initiate({
                    'body': objArr[0],
                    'type': objArr[1],
                    'memory': objArr[2]
                });
            `

            global.TaskMaster.schedule(this.memory.spawnRoom, Game.time + this.mineral.ticksToRegeneration, task, [[...this.body], this.memory.type, {...this.memory}]);
            //no more rebirth for you
            delete this.memory.generation;
        }
    }

    /**
     * Move to container then start harvesting the mineral
     */
    harvest() {
        if (this.pos.inRangeTo(this.container, 0)) {
            if (this.extractor.cooldown == 0){
                this.liveObj.harvest(this.mineral);
            }
            //do nothing
        } else {
            this.liveObj.moveTo(this.container);
        }
    }

    /**
     * Method to spawn a courier that will move the minerals
     */
    spawnCourier() {
        this.getSupervisor().initiate({
            'body': [CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE],
            'type': 'courier',
            'memory': {
                'container': this.memory.container,
                'resource': this.mineral.mineralType
            }
        });
        
        this.memory.courierSpawned = true;
    }
}

module.exports = Excavator;