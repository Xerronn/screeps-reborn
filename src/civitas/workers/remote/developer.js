const Remotus = require("./remotus");
const Worker = require("../worker");

//remote engineer definition
class Developer extends Remotus {
    constructor(creepId) {
        super(creepId);
        this.initialized = false;
        this.noPillage = false;

        if (this.memory.travelTime) {
            //calculate the time that you need to spawn a replacement
            //distance to travel + time to spawn + 10 buffer ticks
            this.timeToSpawn = this.memory.travelTime + (this.body.length * CREEP_SPAWN_TIME) + 10;
        }

        let roomSources = global.Archivist.getSources(this.targetRoom);
        if (this.memory.source) {
            //ensure that the array exists
            !(this.constructor.name in roomSources[this.memory.source].workers) && 
                (roomSources[this.memory.source].workers[this.constructor.name] = []);

            let index = roomSources[this.memory.source].workers[this.constructor.name].indexOf(this.name);
            if (index < 0) {
                roomSources[this.memory.source].workers[this.constructor.name].push(this.name);
            }
        } else {
            //for first time an ancestry has spawned
            let sortedSources = _.sortBy(Object.keys(roomSources), s => this.pos.getRangeTo(Game.getObjectById(s)));
            let currentBest = "";
            for (let source of sortedSources) {
                //ensure that the array exists
                !(this.constructor.name in roomSources[source].workers) && 
                (roomSources[source].workers[this.constructor.name] = []);

                //find the source with the least workers assigned
                if (currentBest == "" || roomSources[source].workers[this.constructor.name].length < roomSources[currentBest].workers[this.constructor.name].length) {
                    currentBest = source;
                }
            }
            roomSources[currentBest].workers[this.constructor.name].push(this.name);
            this.memory.source = currentBest;
        }
        
        this.update(true);
    }

    update(force=false) {
        if (this.updateTick != Game.time || force == true) {
            if (!super.update(force)) {
                //remove creep from its array on death
                let roomSources = global.Archivist.getSources(this.targetRoom);
                let index = roomSources[this.memory.source].workers[this.constructor.name].indexOf(this.name);
                roomSources[this.memory.source].workers[this.constructor.name].splice(index, 1);
                return false;
            }
            //attributes that will change tick to tick
            if (this.memory.source) {
                this.source = Game.getObjectById(this.memory.source);
            }
        }
        return true;
    }

    run() {
        //move to room, ignore flee
        if (super.run(true, false)) return;

        //calculate when to spawn a new one
        if (!this.memory.travelTime) {
            this.memory.travelTime = PathFinder.search(this.pos, Game.rooms[this.memory.spawnRoom].storage.pos).path.length;
            this.timeToSpawn = this.memory.travelTime + (this.body.length * CREEP_SPAWN_TIME) + 10;
        }

        if (this.memory.generation && parseFloat(global.Archivist.getGameStage(this.targetRoom)) >= 3.1) {
            //the creep will support the new room until it reaches RCL 3
            delete this.memory.generation;
        }
        //make sure to spawn a new developer early to maintain better uptime
        if (this.memory.generation !== undefined && this.timeToSpawn && this.ticksToLive <= this.timeToSpawn) {
            //basically rebirth but without the dying first

            let task = `
                global.Imperator.administrators[\"` + this.memory.spawnRoom + `\"].supervisor.initiate({
                    'body': objArr[0],
                    'type': objArr[1],
                    'memory': objArr[2]
                });
            `

            global.TaskMaster.schedule(this.memory.spawnRoom, Game.time + this.timeToSpawn, task, [[...this.body], this.memory.type, {...this.memory}]);
            //no more rebirth for you
            delete this.memory.generation;
        }

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

    }

    /**
     * Function to harvest the assigned source
     */
     harvest() {
        Worker.prototype.harvest.apply(this);
    }

    /**
     * Method to steal resources from a leftover enemy terminal or storage
     * @returns if pillage is happening
     */
    pillage() {
        return Worker.prototype.pillage.apply(this);
    }

    /**
     * upgrade the controller
     */
     upgradeController() {
        Worker.prototype.upgradeController.apply(this);
    }

    /**
     * Build construction site closest to current position
     */
    build() {
        Worker.prototype.build.apply(this);
    }

    /**
     * Function to fill spawn and extensions
     */
    fillExtensions() {
        Worker.prototype.fillExtensions.apply(this);
    }

    /**
     * Function to fill towers
     */
     fillTowers() {
        Worker.prototype.fillTowers.apply(this);
    }
}

module.exports = Developer;