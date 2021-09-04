const Civitas = require("../civitas");

//the parent harvester definition
class Worker extends Civitas {
    constructor(creepId) {
        super(creepId);
        
        let roomSources = global.Archivist.getSources(this.room);

        //attributes that won't change tick to tick
        if (this.memory.source) {
            //for creep rebirth and object init
            this.sourceId = this.memory.source;

            //ensure that the array exists
            !(this.constructor.name in roomSources[this.sourceId].workers) && 
                (roomSources[this.sourceId].workers[this.constructor.name] = []);

            let index = roomSources[this.sourceId].workers[this.constructor.name].indexOf(this.name);
            if (index < 0) {
                roomSources[this.sourceId].workers[this.constructor.name].push(this.name);
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
            this.sourceId = currentBest;
            this.memory.source = currentBest;
        }

        this.numWork = 0;
        for (let part of this.body) {
            if (part == WORK) {
                this.numWork++;
            }
        }
        

        this.update(true);
    }

    update(force=false) {
        //! this removes creeps from the source arrays when they die, which doesn't work with rebirth.
        //! need to add a way to track if a creep is rebirthing or not
        if (this.updateTick != Game.time || force == true) {
            if (!super.update(force)) {
                //remove creep from its array on death
                let roomSources = global.Archivist.getSources(this.room);
                let index = roomSources[this.sourceId].workers[this.constructor.name].indexOf(this.name);
                roomSources[this.sourceId].workers[this.constructor.name].splice(index, 1);
                return false;
            }
            //attributes that will change tick to tick
            this.source = Game.getObjectById(this.sourceId);
        }
        return true;
    }

    /**
     * Function that runs on each game loop. Decides what to do
     */
    run() {
        if (this.store.getFreeCapacity(RESOURCE_ENERGY) > 0 ) {
            this.harvest();
        }
    }

    /**
     * upgrade the controller
     */
    upgradeController() {
        let controller = Game.rooms[this.room].controller;

        if (this.pos.inRangeTo(controller, 3)) {
            this.liveObj.upgradeController(controller);
        } else {
            this.liveObj.travelTo(controller);
        }
    }

    /**
     * build construction sites closest to current position
     */
    build() {
        let liveClosestSite = Game.getObjectById(this.memory.closestSite);
        
        if (!liveClosestSite) {
            global.Imperator.administrators[this.room].supervisor.wrap(true);
            let sites = Game.rooms[this.room].find(FIND_MY_CONSTRUCTION_SITES);

            liveClosestSite = this.pos.findClosestByRange(sites);
            this.memory.closestSite = liveClosestSite.id;
        }

        if (this.pos.inRangeTo(liveClosestSite, 3)) {
            this.liveObj.build(liveClosestSite);
        } else {
            this.liveObj.travelTo(liveClosestSite);
        }
    }

    /**
     * Function to harvest the assigned source
     */
     harvest() {
        if (this.pos.inRangeTo(this.source, 1)) {
            this.liveObj.harvest(this.source);
        } else {
            this.liveObj.travelTo(this.source);
        }
    }

    /**
     * Function to fill spawn and extensions
     */
    fillExtensions() {
        let liveClosestExt = Game.getObjectById(this.memory.closestExt);
        if (!liveClosestExt || liveClosestExt.store.getFreeCapacity(RESOURCE_ENERGY) == 0) {
            let ext = global.Archivist.getStructures(this.room, STRUCTURE_EXTENSION);
            let spawns = global.Archivist.getStructures(this.room, STRUCTURE_SPAWN);

            let fillables = spawns.concat(ext).filter(
                obj => obj.store.getFreeCapacity(RESOURCE_ENERGY) > 0
            );
            
            if (fillables.length == 0) {
                //let all the other creeps know that there isn't any point in looking
                global.Archivist.setExtensionsFilled(this.room, true);
                return;
            }
            liveClosestExt = this.pos.findClosestByRange(fillables);
            this.memory.closestExt = liveClosestExt.id;
        }

        if (this.pos.inRangeTo(liveClosestExt, 1)) {
            this.liveObj.transfer(liveClosestExt, RESOURCE_ENERGY);
        } else {
            this.liveObj.travelTo(liveClosestExt);
        }
    }

    /**
     * Function to fill towers
     */
    fillTowers() {
        let liveClosestTower = Game.getObjectById(this.memory.closestTower);
        if (!liveClosestTower || liveClosestTower.store.getFreeCapacity(RESOURCE_ENERGY) == 0) {
            let towers = global.Archivist.getStructures(this.room, STRUCTURE_TOWER);

            let fillables = towers.filter(
                obj => obj.store.getFreeCapacity(RESOURCE_ENERGY) > 0
            );
            
            if (fillables.length == 0) {
                //let all the other creeps know that there isn't any point in looking
                global.Archivist.setTowersFilled(this.room, true);
                return;
            }
            liveClosestTower = this.pos.findClosestByRange(fillables);
            this.memory.closestTower = liveClosestTower.id;
        }

        if (this.pos.inRangeTo(liveClosestTower, 1)) {
            this.liveObj.transfer(liveClosestTower, RESOURCE_ENERGY);
        } else {
            this.liveObj.travelTo(liveClosestTower);
        }
    }

    withdrawStorage() {
        let storage = Game.rooms[this.room].storage;
        if (!storage || storage.store.getUsedCapacity(RESOURCE_ENERGY) < this.store.getFreeCapacity(RESOURCE_ENERGY)) return false;

        if (this.pos.inRangeTo(storage, 1)) {
            this.liveObj.withdraw(storage, RESOURCE_ENERGY);
        } else {
            this.liveObj.travelTo(storage);
        }
    }

    /**
     * Method to steal energy from leftover enemy storage and terminals
     * @returns If pillage does anything
     */
    pillage() {
        let storage = Game.rooms[this.room].storage;
        let terminal = Game.rooms[this.room].terminal;
        let target = undefined;
        if (storage) {
            if (storage.store.getUsedCapacity(RESOURCE_ENERGY) > 0) {
                target = storage;
            } else {
                if (!storage.my) storage.destroy();
            }
        } else if (terminal) {
            if (terminal.store.getUsedCapacity(RESOURCE_ENERGY) > 0) {
                target = terminal;
            } else {
                if (!terminal.my) terminal.destroy();
            }
        } else if (Game.rooms[this.room].find(FIND_RUINS).length > 0 || this.memory.ruin) {
            let targetRuin = Game.getObjectById(this.memory.ruin);

            if (targetRuin && targetRuin.store.getUsedCapacity(RESOURCE_ENERGY) > 0) {
                target = targetRuin;
            } else {
                let ruins = Game.rooms[this.room].find(FIND_RUINS);
                for (let ruin of ruins) {
                    if (ruin.structure.structureType == STRUCTURE_STORAGE && ruin.store.getUsedCapacity(RESOURCE_ENERGY) > 0) {
                        this.memory.ruin = ruin.id;
                        target = ruin;
                    }
                }
            }
        }

        if (target === undefined) {
            this.noPillage = true;
            delete this.memory.ruin;
            return false;
        }

        if (this.pos.inRangeTo(target, 1)) {
            this.liveObj.withdraw(target, RESOURCE_ENERGY);
        } else {
            this.liveObj.travelTo(target);
        }
        return true;
    }
}

module.exports = Worker;