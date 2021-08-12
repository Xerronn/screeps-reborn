const Remotus = require("./remotus");

//class declaration for a remote room hauler creep
//source and container must be passed by prospector
class Hauler extends Remotus {
    constructor(creepId) {
        super(creepId);

        if (this.memory.travelTime) {
            //calculate the time that you need to spawn a replacement
            //distance to travel + time to spawn + 10 buffer ticks
            this.timeToSpawn = this.memory.travelTime + (this.body.length * CREEP_SPAWN_TIME) + 10;
        }

        this.stuckTick = 0;
        this.stuckPos = this.pos;

        //if the creep is using the cached path
        this.pathing = true;
        
        this.update(true);
    }

    update(force=false) {
        if (this.updateTick != Game.time || force == true) {
            if (!super.update(force)) {
                //creep is dead
                return false;
            }

            //attributes that change tick to tick
            this.storage = Game.rooms[this.memory.spawnRoom].storage;
            if (this.memory.source) {
                this.source = Game.getObjectById(this.memory.source);
            }
            if (this.memory.container) {
                this.container = Game.getObjectById(this.memory.container);
            }

            //cached path for movement defined after we have a container to path to
            if (!this.path && this.container) {
                this.path = PathFinder.search(
                    this.storage.pos, 
                    {
                        "pos" : this.container.pos,
                        "range" : 1
                    },
                    {
                        "roomCallback": global.Illustrator.getCostMatrix,
                        "plainCost": 2,
                        "swampCost": 10
                    }
                ).path;

                this.reversedPath = [...this.path].reverse();
            }
            
        }
        return true;
    }

    run() {
        //todo: path caching and traversal
        //march to room and flee if enemies
        if (this.memory.task != "deposit") {
            if (super.run(false)) return;
        }

        if (this.store.getUsedCapacity(RESOURCE_ENERGY) == 0 || (this.memory.task == "withdraw" && this.store.getFreeCapacity(RESOURCE_ENERGY) > 0)) {
            this.memory.task = "withdraw";

            //withdraw from tombstone on current tile
            this.withdrawTomb()
            //pickup dropped energy from the current tile
            this.withdrawDropped();

            //march to the remote
            if (!this.pathing) {
                if (this.room != this.targetRoom) {
                    this.march();
                    return;
                }
            } else {
                this.moveByPath();
            }

            this.withdrawContainer();
            
        } else {
            this.memory.task = "deposit"
            //march to the origin room
            if (!this.pathing) {
                if (this.room != this.memory.spawnRoom) {
                    this.march(this.memory.spawnRoom);
                    return;
                }
            } else {
                this.moveByPath(true);
            }
            this.depositStorage();
        }

        //make sure to spawn new hauler before the current one dies, to maintain better uptime
        if (this.memory.generation !== undefined && this.ticksToLive <= this.timeToSpawn) {
            //basically rebirth but without the dying first
            this.getSupervisor().initiate({
                'body': [...this.body],
                'type': this.memory.type,
                'memory': {...this.memory}
            });

            //no more rebirth for you
            delete this.memory.generation;
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
                    //set that we can now start moving by path again
                    this.pathing = true;

                    //calculate travelTime
                    if (!this.memory.travelTime) {
                        this.memory.travelTime = PathFinder.search(this.pos, Game.rooms[this.memory.spawnRoom].storage.pos).path.length;
                        this.timeToSpawn = this.memory.travelTime + (this.body.length * CREEP_SPAWN_TIME) + 10;
                    }
                }
            } else if (!this.pathing) {
                this.liveObj.moveTo(this.container);
            }
        //everything after this only happens if the container dies for some reason
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
     * Method to pull energy from tombstones along the hauler's path
     */
    withdrawTomb() {
        let tombs = Game.rooms[this.room].find(FIND_TOMBSTONES);
        for (let tomb of tombs) {
            if (this.pos.inRangeTo(tomb, 0) && tomb.store.getUsedCapacity(RESOURCE_ENERGY) > 0){
                this.liveObj.withdraw(tomb, RESOURCE_ENERGY);

                //bring the energy back to storage
                let amount = tomb.store.getUsedCapacity(RESOURCE_ENERGY);
                if (amount > this.store.getFreeCapacity(RESOURCE_ENERGY) / 1.2 || this.pos.getRangeTo(this.storage) < 15 && amount > this.store.getFreeCapacity(RESOURCE_ENERGY) / 3) {
                    this.memory.task = "deposit";
                }
                return true;
            }
        }
        return false;
    }

    /**
     * Method to withdraw dropped energy along the hauler's path
     */
    withdrawDropped() {
        let resources = this.pos.lookFor(LOOK_RESOURCES);
        if (resources) {
            for (let res of resources) {
                if (res.resourceType == RESOURCE_ENERGY) {
                    this.liveObj.pickup(res);
                    if (res.amount > this.store.getFreeCapacity(RESOURCE_ENERGY) / 1.2 || this.pos.getRangeTo(this.storage) < 15 && res.amount > this.store.getFreeCapacity(RESOURCE_ENERGY) / 3) {
                        this.memory.task = "deposit";
                    }
                }
            }
        }
    }

    /**
     * Move to storage and deposit all stored energy
     */
     depositStorage() {
        if (this.pos.inRangeTo(this.storage, 1)) {
            this.liveObj.transfer(this.storage, RESOURCE_ENERGY);
            //set that we can start using cached path again
            this.pathing = true;
            //stat tracking
            let currentEnergy = global.Archivist.getStatistic(this.memory.spawnRoom, "RemoteEnergyGained");
            global.Archivist.setStatistic(this.memory.spawnRoom, "RemoteEnergyGained", currentEnergy + this.store.getUsedCapacity(RESOURCE_ENERGY));
        } else if (!this.pathing) {
            this.liveObj.moveTo(this.storage);
        }
    }

    /**
     * Method to travel along the cached path
     * @param {Boolean} reversed go in the opposite direction
     * @param {Boolean} reset reset the path to the start
     */
    moveByPath(reversed) {
        //detect if creep is stuck, and path normally if necessary
        if (this.stuckPos.x != this.pos.x || this.stuckPos.y != this.pos.y) {
            this.stuckPos = this.pos;
            this.stuckTick = 0;
        } else {
            this.stuckPos = this.pos;
            this.stuckTick++;
        }

        if (this.stuckTick > 3) {
            //do something
            console.log("DOOR STUCK");
            this.pathing = false;
        }
        if (!reversed) {
            this.liveObj.moveByPath(this.path);
        } else {
            this.liveObj.moveByPath(this.reversedPath);
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