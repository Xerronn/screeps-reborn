const Remotus = require("./remotus");

//class that handles remote mining setup and then the actual mining too
class Prospector extends Remotus {
    constructor(creepId) {
        super(creepId);

        this.initialized = false;
        this.evolved = false;

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
            }
        }
        return true;
    }

    run() {
        if (!this.arrived) {
            //march to assigned room
            this.march();
            return;
        }

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
        } else if (Game.rooms[this.room].find(FIND_CONSTRUCTION_SITES).length > 0) {
            //now build the roads and the containers
            this.memory.task = "build";
            this.build();
        } else {
            //done building time for full drop mining mode
            this.memory.task = "dropHarvesting";
            if (!this.evolved) this.evolve();
            if (!this.memory.container) {
                let container = this.source.pos.findInRange(allContainers, 1)[0];

                if (container) {
                    this.container = container;
                    this.memory.container = container.id;
                }
            }
            
            if (this.container.hits < this.container.hitsMax) {
                this.memory.task = "repair";
                this.repairContainer();
            } else if (this.source.ticksToRegeneration > 0) {
                this.harvest(this.container, 0);
            }
        }
    }

    /**
     * Function to harvest the assigned source
     */
    harvest(target, distance) {
        if (this.pos.inRangeTo(target, distance)) {
            this.liveObj.harvest(this.source);
        } else {
            this.liveObj.moveTo(this.source);
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
                if (thisRemote[source] !== "claimed") {
                    this.memory.source = source.id;
                    this.source = source;
                    thisRemote[source] = "claimed";
                    break;
                }
            }
        }
        this.initialized = true;
    }

    /**
     * Method that builds construction sites to their designated source
     */
    planRoads() {
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
                    Game.rooms[this.room].createConstructionSite(sites[i].x, sites[i].y, STRUCTURE_ROAD);
                } else {
                    //build a container on the last step in the path
                    Game.rooms[this.room].createConstructionSite(sites[i].x, sites[i].y, STRUCTURE_CONTAINER);
                }
            }
        }

        //set the flag so it only happens once
        global.Archivist.setRemoteBuilt(this.room, true);
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