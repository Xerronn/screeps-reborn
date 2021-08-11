const Remotus = require("./remotus");

//class declaration for a remote room hauler creep
//source and container must be passed by prospector
class Hauler extends Remotus {
    constructor(creepId) {
        super(creepId);
        
        this.update(true);
    }

    update(force=false) {
        if (this.updateTick != Game.time || force == true) {
            if (!super.update(force)) {
                //creep is dead
                return false;
            }

            this.storage = Game.rooms[this.memory.spawnRoom].storage;

            //attributes that change tick to tick
            if (this.memory.source) {
                this.source = Game.getObjectById(this.memory.source);
            }
            if (this.memory.container) {
                this.container = Game.getObjectById(this.memory.container);
            }
            
        }
        return true;
    }

    run() {
        //todo: path caching and traversal
        //march to room and flee if enemies
        if (this.memory.task != "deposit") {
            if (super.run()) return;
        }

        if (this.store.getUsedCapacity(RESOURCE_ENERGY) == 0 || (this.memory.task == "withdraw" && this.store.getFreeCapacity(RESOURCE_ENERGY) > 0)) {
            this.memory.task = "withdraw";

            let resources = this.pos.lookFor(LOOK_RESOURCES);
            if (resources) {
                for (let res of resources) {
                    if (res.resourceType == RESOURCE_ENERGY) {
                        this.liveObj.pickup(res);
                        if (res.amount > this.store.getFreeCapacity(RESOURCE_ENERGY) / 1.2 || this.pos.getRangeTo(this.storage) < 15 && res.amount > this.store.getFreeCapacity(RESOURCE_ENERGY) / 2) {
                            this.memory.task = "deposit";
                        }
                    }
                }
            }

            this.withdrawContainer();
        } else {
            this.memory.task = "deposit"
            this.depositStorage();
        }
    }

    /**
     * Function to withdraw energy from the container
     */
    withdrawContainer() {
        if (this.container) {
            if (this.pos.inRangeTo(this.container, 1)) {
                if (this.container.store.getUsedCapacity(RESOURCE_ENERGY) > this.store.getFreeCapacity(RESOURCE_ENERGY)) {
                    this.liveObj.withdraw(this.container, RESOURCE_ENERGY);
                }
            } else {
                this.liveObj.moveTo(this.container);
            }
        } else {
            //wait until new container is built, then assign it again
            if (Game.rooms[this.room].find(FIND_MY_CONSTRUCTION_SITES).length == 0) {
                let allContainers = Game.rooms[this.room].find(FIND_STRUCTURES, {filter: {structureType: STRUCTURE_CONTAINER}});
                this.container = this.source.pos.findInRange(allContainers, 1)[0];
                if (this.container) {
                    this.memory.container = this.container.id;
                }
            }
            if (!this.pos.inRangeTo(this.source, 2)) {
                this.liveObj.moveTo(this.source);
            }
        }
    }

    /**
     * Move to storage and deposit all stored energy
     */
     depositStorage() {
        if (this.pos.inRangeTo(this.storage, 1)) {
            this.liveObj.transfer(this.storage, RESOURCE_ENERGY);
            //stat tracking
            let currentEnergy = global.Archivist.getStatistic(this.memory.spawnRoom, "RemoteEnergyGained");
            global.Archivist.setStatistic(this.memory.spawnRoom, "RemoteEnergyGained", currentEnergy + this.store.getUsedCapacity(RESOURCE_ENERGY));
        } else {
            this.liveObj.moveTo(this.storage);
        }
    }

    /**
     * Method that makes the hauler twice as large
     * called by executive when rcl reaches 7
     */
    evolve() {
        let numCarry = 0;
        for (let part of this.body) {
            if (part == CARRY) {
                numCarry++;
            }
        }

        let targetMoves = Math.min((numCarry * 2), 32);
        let newBody = [];
        for (let i = 0; i < targetMoves; i++) {
            newBody.unshift(CARRY);
            if (i % 2 != 0) {
                newBody.push(MOVE);
            }
        }

        this.memory.body = newBody;
    }
}

module.exports = Hauler;