const Remotus = require("./remotus");

//class that handles remote mining setup and then the actual mining too
class Prospector extends Remotus {
    constructor(creepId) {
        super(creepId);

        this.initialized = false;
        this.evolved = false;

        if (this.memory.travelTime) {
            //calculate the time that you need to spawn a replacement
            //distance to travel + time to spawn + 10 buffer ticks
            this.timeToSpawn = this.memory.travelTime + (this.body.length * CREEP_SPAWN_TIME) + 10;
        }

        this.update(true);
    }

    update(force=false) {
        if (this.updateTick != Game.time || force == true) {
            if (!super.update(force)) {
                //creep is dead
                return false;
            }

            //attributes that change tick to tick
            if (this.memory.source) {
                this.source = Game.getObjectById(this.memory.source);
            }

            if (this.memory.container) {
                this.container = Game.getObjectById(this.memory.container);

                if (!this.container && this.arrived) {
                    //rebuild the container
                    this.planRoads(true);
                    delete this.memory.container;
                }
            }
        }
        return true;
    }

    run() {
        //march to room and flee if enemies
        super.run();

        //once we get to the room
        if (!this.initialized) {
            this.initializeSource();

            //plan roads only once
            if (!global.Archivist.getRemoteBuilt(this.memory.spawnRoom)) {
                this.planRoads();
            }
        }

        //First and foremost, fill up carry parts
        if (this.store.getUsedCapacity(RESOURCE_ENERGY) == 0 || (this.memory.task == "harvest" && this.store.getFreeCapacity(RESOURCE_ENERGY) > 0)) {
            this.memory.task = "harvest";
            this.harvest(this.source, 1);
        } else if (Game.rooms[this.room].find(FIND_MY_CONSTRUCTION_SITES).length > 0) {
            //now build the roads and the containers
            this.memory.task = "build";
            this.build();
        } else {
            //done building, time for full drop mining mode
            this.memory.task = "dropHarvesting";
            if (!this.evolved) this.evolve();
            if (!this.memory.container) {
                let allContainers = Game.rooms[this.room].find(FIND_STRUCTURES, {filter: {structureType: STRUCTURE_CONTAINER}});
                let container = this.source.pos.findInRange(allContainers, 1)[0];

                if (container) {
                    this.container = container;
                    this.memory.container = container.id;
                }
            }

            //spawn haulers
            if (!this.memory.haulersSpawned) {
                this.spawnHauler();
            }
            
            //repair the container whenever it gets low
            if (this.container && this.container.hits < this.container.hitsMax) {
                this.memory.task = "repair";
                this.repairContainer();
            } else if (this.container && this.source.energy > 0) {
                this.harvest(this.container, 0);
            }
        }

        //every 100 ticks check to see if a road is below 2000 hits
        let curatorSpawned = global.Archivist.getCuratorSpawned(this.memory.spawnRoom);
        if (Game.time % 100 == 0 && !curatorSpawned) {
            let allRoads = Game.rooms[this.room].find(FIND_STRUCTURES, {filter:{structureType: STRUCTURE_ROAD}});

            for (let road of allRoads) {
                if (road.hits < road.hitsMax / 2.5) {
                    this.getExecutive().spawnCurator(this.room);
                    global.Archivist.setCuratorSpawned(this.memory.spawnRoom, true);
                }
            }
        }

        //make sure to spawn new miner before the current one dies, to maintain 100% uptime
        if (this.memory.generation !== undefined && this.ticksToLive <= this.timeToSpawn) {
            //basically rebirth but without the dying first
            this.getSupervisor().initiate({
                'body': [...this.body],
                'type': this.memory.type,
                'memory': {...this.memory}
            });

            //no more rebirth for you
            delete this.memory.generation;
            this.replaced = true;
        }
    }

    /**
     * Function to harvest the assigned source
     */
    harvest(target, distance) {
        if (this.pos.inRangeTo(target, distance)) {
            this.liveObj.harvest(this.source);

            //if traveltime to replace isn't calculated do it now
            if (!this.memory.travelTime) {
                this.memory.travelTime = PathFinder.search(this.pos, Game.rooms[this.memory.spawnRoom].storage.pos).path.length;
                this.timeToSpawn = this.memory.travelTime + (this.body.length * CREEP_SPAWN_TIME) + 10;
            }
        } else {
            this.liveObj.moveTo(target);
        }
    }

    /**
     * build construction sites closest to current position
     */
    build() {
        let liveClosestSite = Game.getObjectById(this.memory.closestSite);
        
        if (!liveClosestSite) {
            let sites = Game.rooms[this.room].find(FIND_MY_CONSTRUCTION_SITES);

            liveClosestSite = this.pos.findClosestByRange(sites);
            this.memory.closestSite = liveClosestSite.id;
        }

        if (this.pos.inRangeTo(liveClosestSite, 1)) {
            this.liveObj.build(liveClosestSite);
        } else {
            this.liveObj.moveTo(liveClosestSite);
        }
    }

    repairContainer() {
        if (this.pos.inRangeTo(this.container, 1)) {
            this.liveObj.repair(this.container);
        } else {
            this.liveObj.moveTo(this.container);
        }
    }

    /**
     * Method that assigns the miner to a source when entering into the room
     */
    initializeSource() {
        //figure out source memory
        if (!this.memory.source) {
            let thisRemote = global.Archivist.getRemotes(this.memory.spawnRoom)[this.memory.targetRoom];
            let sources = Game.rooms[this.room].find(FIND_SOURCES);

            //ensure unique source claim
            for (let source of sources) {
                if (thisRemote[source.id] !== "claimed") {
                    this.memory.source = source.id;
                    this.source = source;
                    thisRemote[source.id] = "claimed";
                    break;
                }
            }
        }
        this.initialized = true;
    }

    /**
     * Method that builds construction sites to their designated source
     */
    planRoads(justContainer = false) {
        let roadSites = [];
        let sources = Game.rooms[this.room].find(FIND_SOURCES);

        //build roads from the creeps position to both of the sources
        for (let source of sources) {
            roadSites.push(this.pos.findPathTo(source, {range: 1, ignoreCreeps: true}));
        }

        //build the roads
        for (var sites of roadSites) {
            for (let i = 0; i < sites.length; i++) {
                if (i < sites.length - 1) {
                    if (!justContainer) {
                        Game.rooms[this.room].createConstructionSite(sites[i].x, sites[i].y, STRUCTURE_ROAD);
                    }
                } else {
                    //build a container on the last step in the path
                    Game.rooms[this.room].createConstructionSite(sites[i].x, sites[i].y, STRUCTURE_CONTAINER);
                }
            }
        }

        //set the flag so it only happens once
        global.Archivist.setRemoteBuilt(this.memory.spawnRoom, true);
    }

    /**
     * Method to spawn hauler(s) to take the energy back to the main room
     */
    spawnHauler() {
        let travelLength = this.memory.travelTime * 12 * 2;
        let carryCount = Math.ceil(travelLength / 50);
        let numHaulers = Math.ceil(carryCount / 30);

        let body = [];
        for (let i = 0; i < Math.ceil(carryCount / numHaulers); i++) {
            body.push(MOVE);
            body.unshift(CARRY);
        }

        for (let i = 0; i < numHaulers; i++) {
            this.getSupervisor().initiate({
                'body': body,
                'type': 'hauler',
                'memory': {
                    'generation' : 0, 
                    'targetRoom': this.targetRoom, 
                    'noRoads': false,
                    'container': this.memory.container,
                    'source': this.memory.source
                }
            });
        }

        this.memory.haulersSpawned = true;
    }

    /**
     * Method to change body type once all the construction is done
     */
    evolve() {
        this.memory.body = [WORK, WORK, WORK, WORK, WORK, WORK, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE];
        this.memory.noRoads = false;
        this.evolved = true;
    }
}

module.exports = Prospector;