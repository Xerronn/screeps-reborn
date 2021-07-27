//entity that manages creep spawning
class Initiator {
    constructor(room) {
        this.room = room;
    }

    /**
     * initiator logic to run each tick
     */
    run() {
        //check gamestage every 10 ticks
        if (Game.time % 10 == 0) {
            let calculation = this.calculateGameStage(this.room);
            let current = global.Archivist.getGameStage(this.room);
            //if gamestage is valid and different from what we have stored
            if (calculation != -1 && current != calculation) {
                //do some architect stuff
                //global.Architect.design(this.room, calculation);
                global.Archivist.setGameStage(this.room, calculation);
            }
        }

        //once gamestage 5 is active, phasetwo is in effect
        if (global.Archivist.getGameStage(this.room) >= 5) {
            if (Game.rooms[this.room].find(FIND_MY_CONSTRUCTION_SITES).length > 0) {
                let contractors = global.Archivist.getNumContractors(this.room);

                if (contractors === undefined) {
                    contractors = 0;
                }

                if (contractors < 2) {
                    this.initiate({
                        'body': [
                            WORK, WORK, WORK, WORK,
                            CARRY, CARRY, CARRY, CARRY,
                            MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE
                        ],
                        'type': 'contractor',
                        'memory': { "generation": 0 }
                    });
                    global.Archivist.setNumContractors(this.room, contractors + 1);
                }
            }
        }
    }

    /**
     * Function to get the room's originator
     * @returns Originator
     */
    getOriginator() {
        return global.Imperator.administrators[this.room].originator;
    }

    /**
     * Function that takes a creep object and makes a new creep based on that object
     * @param {Object} template An object that contains body, type, and memory
     * @param {boolean} rebirth whether or not this is a rebirth
     */
    initiate(template, rebirth = false) {
        let originator = this.getOriginator();
        //to make sure that we actually find a nexus that can spawn this request.
        let foundNexus = false;
        //loop through the spawns until an available one is found
        for (let nexus of originator.constructs["nexus"]) {
            if (!nexus.spawning && !nexus.spawningThisTick) {
                foundNexus = true;
                //! these seem to be failing
                if (rebirth) {
                    if (!template.memory.generation) {
                        template.memory.generation = 0
                    }
                    template.memory.generation++;
                }

                //use the body stored in memory if it exists, as it can contain evolutions
                let newBody = template.memory.body;
                if (!newBody) {
                    newBody = template.body;
                }
                let success = nexus.spawnCreep(newBody, template.type, { ...template.memory });

                //if the request fails, schedule it for 20 ticks in the future
                if (success != OK) {
                    //so we can reschedule
                    foundNexus = false;
                }
            }
        }

        if (!foundNexus) {
            let task = "global.Imperator.administrators[objArr[1].room].initiator.initiate(objArr[0]);";
            global.Executive.schedule(Game.time + 20, task, [{ ...template }, this]);
        }

        if (rebirth) {
            this.dismiss(template);
        }
    }

    /**
     * Delete the class holding the dead creep
     * @param {Proletarian} proletarian 
     */
    dismiss(proletarianType) {
        //If the creep is replacing a dead creep, we delete it from memory
        let originator = this.getOriginator();
        let origArr = originator.proletarian[proletarianType.type];
        let index = origArr.indexOf(proletarianType);
        if (index >= 0) origArr.splice(index, 1);
        //todo: we can use the absence of this to see when we missed a creep due to global reset
        delete Memory.creeps[proletarianType.memory.name];
    }

    /**
     * Method to calculate the gamestage, should be run occassionally to check for certain game events
     * @param {String} room String representing the room
     * @returns an integer representing the game stage
     */
    calculateGameStage(room) {
        let liveRoom = Game.rooms[room];
        let rcl = liveRoom.controller.level;
        let currentStage = global.Archivist.getGameStage(room);
        if (rcl == 1) {
            //activate phase 1
            return 0;
        }
        if (rcl == 2) {
            //nothing special happens
            return 1;
        }
        if (rcl == 3) {
            //nothing special
            return 2;
        }
        if (rcl == 3 && global.Archivist.getStructures(room, STRUCTURE_TOWER).length > 0) {
            //tower is built, time to build containers
            return 3;
        }
        if (rcl == 4) {
            //nothing special
            return 4;
        }
        if (rcl == 4 && liveRoom.storage) {
            //storage is built, time to switch to phase 2
            return 5;
        }
        if (rcl == 4 && liveRoom.storage && liveRoom.storage.store.getUsedCapacity(RESOURCE_ENERGY) > 100000) {
            //storage is built, has 100,000 energy. time to build bunker roads
            return 6;
        }
        if (rcl == 4 && currentStage == 6 && liveRoom.find(FIND_MY_CONSTRUCTION_SITES) == 0) {
            //bunker roads are built, build roads to sources
            return 7;
        }
        if (rcl == 5) {
            //links are available, time to build controller link and storage link
            return 8;
        }
        if (rcl == 6) {
            //more links are available, build one source link
            return 9;
        }
        if (rcl == 6 && currentStage == 9 && liveRoom.find(FIND_MY_CONSTRUCTION_SITES) == 0) {
            //build excavator and roads to it
            return 10;
        }
        if (rcl == 7) {
            //build second source link
            return 11;
        }
        if (rcl == 7 && currentStage == 11 && liveRoom.find(FIND_MY_CONSTRUCTION_SITES) == 0
            && liveRoom.storage && liveRoom.storage.store.getUsedCapacity(RESOURCE_ENERGY) > 100000) {
            //Start remote mining
            return 12;
        }
        if (rcl == 8) {
            //todo: lots
            return 13;
        }

        return -1;
    }

    /**
     * Initialize spawning for phase one rooms
     * Phase one is defined as RCL 1-4
     */
    phaseOne() {
        //I think 6 engineers is a good starting point
        for (var i = 0; i < 6; i++) {
            let memory = { "generation": 0 }
            let task = "global.Imperator.administrators[objArr[0]].initiator.initiate({'body' : [WORK, CARRY, MOVE, MOVE], 'type': 'engineer', 'memory': objArr[1]});";
            global.Executive.schedule(Game.time + (i * 10), task, [this.room, memory]);
        }
    }

    /**
     * Phase out the engineers in favor of specialized creeps
     */
    phaseTwo() {
        for (let creep of Game.rooms[this.room].find(FIND_MY_CREEPS)) {
            //remove rebirth for engineers
            delete creep.memory.generation;
        }

        let sources = global.Archivist.getSources(this.room);

        //spawn creeps with rebirth enabled
        let memory = { "generation": 0 }
        let creepsToSpawn = [
            { 'body': [CARRY, CARRY, MOVE, MOVE], 'type': 'runner', 'memory': memory },
            { 'body': [WORK, WORK, WORK, WORK, CARRY, CARRY, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE], 'type': 'professor', 'memory': memory },
            { 'body': [WORK, WORK, WORK, WORK, CARRY, CARRY, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE], 'type': 'professor', 'memory': memory },
            { 'body': [WORK, WORK, WORK, WORK, CARRY, CARRY, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE], 'type': 'professor', 'memory': memory }
        ]

        //! TODO: prioritization 
        for (let source of Object.keys(sources)) {
            //one miner per source
            creepsToSpawn.push({ 'body': [WORK, WORK, WORK, WORK, WORK, WORK, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE], 'type': 'miner', 'memory': memory });
            //one courier per source
            //todo: maybe build the body based on how far the transporter has to go between container and storage
            creepsToSpawn.push({ 'body': [CARRY, CARRY, CARRY, MOVE, MOVE, MOVE], 'type': 'courier', 'memory': memory });
        }

        for (let creepToSpawn of creepsToSpawn) {
            this.initiate(creepToSpawn);
        }

    }
}

module.exports = Initiator;