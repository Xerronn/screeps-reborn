//entity that manages the room
class Executive {
    constructor(room) {
        this.room = room;
    }

    /**
     * Exectuive logic to run each tick
     */
    run() {
        //check gamestage every 10 ticks
        if (Game.time % 10 == 0) {
            let calculation = this.calculateGameStage(this.room);
            let current = global.Archivist.getGameStage(this.room);
            //if gamestage is valid and different from what we have stored
            if (calculation != "-1" && current < calculation) {
                //do some architect stuff
                //! global.Architect.design(this.room, calculation);
                global.Archivist.setGameStage(this.room, calculation);
            }
        }

        //once gamestage 5 is active, phasetwo is in effect
        if (parseFloat(global.Archivist.getGameStage(this.room)) >= 4.1) {
            if (Game.rooms[this.room].find(FIND_MY_CONSTRUCTION_SITES).length > 0) {
                let contractors = global.Archivist.getNumContractors(this.room);

                if (contractors === undefined) {
                    contractors = 0;
                }

                if (contractors < 2) {
                    this.getSupervisor().initiate({
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
     * Function to get the room's supervisor
     * @returns Supervisor
     */
    getSupervisor() {
        return global.Imperator.administrators[this.room].supervisor;
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
        let calculation = "-1"; //hopefully never calculation = s this

        if (rcl == 1) {
            //activate phase 1
            calculation = "1";
        }
        if (rcl == 2) {
            //nothing special happens
            calculation = "2";
        }
        if (rcl == 3) {
            //nothing special
            calculation = "3";
        }
        if (rcl == 3 && global.Archivist.getStructures(room, STRUCTURE_TOWER).length > 0) {
            //tower is built, time to build containers
            calculation = "3.1";
        }
        if (rcl == 4) {
            //nothing special
            calculation = "4";
        }
        if (rcl == 4 && liveRoom.storage) {
            //storage is built, time to switch to phase 2
            calculation = "4.1";
        }
        if (rcl == 4 && liveRoom.storage && liveRoom.storage.store.getUsedCapacity(RESOURCE_ENERGY) > 100000) {
            //storage is built, has 100,000 energy. time to build bunker roads
            calculation = "4.2";
        }
        if (rcl == 4 && currentStage == "4.2" && liveRoom.find(FIND_MY_CONSTRUCTION_SITES).length == 0) {
            //bunker roads are built, build roads to sources
            calculation = "4.3";
        }
        if (rcl == 5) {
            //links are available, time to build controller link and storage link
            calculation = "5";
        }    
        if (rcl == 6) {
            //rcl 6 has lots of expensive stuff to build
            calculation = "6";
        }
        if (rcl == 6 && currentStage == "6" && liveRoom.find(FIND_MY_CONSTRUCTION_SITES).length == 0) {
            //lots of expensive stuff is done building, time to build one source link
            calculation = "6.1";
        }
        if (rcl == 6 && currentStage == "6.1" && liveRoom.find(FIND_MY_CONSTRUCTION_SITES).length == 0) {
            //build excavator and roads to it
            calculation = "6.2";
        }
        if (rcl == 6 && currentStage == "6.2" && liveRoom.find(FIND_MY_CONSTRUCTION_SITES).length == 0) {
            //time to start scouting
            calculation = "6.3";
        }
        if (rcl == 6 && currentStage == "6.3" && global.Archivist.getDoneScouting(this.room) == true) {
            //time to build road to the remote
            calculation = "6.4";
        }
        if (rcl == 7) {
            //build second source link
            calculation = "7";
        }
        if (rcl == 7 && currentStage == "7" && liveRoom.find(FIND_MY_CONSTRUCTION_SITES).length == 0
            && liveRoom.storage && liveRoom.storage.store.getUsedCapacity(RESOURCE_ENERGY) > 100000) {
            //Start remote mining
            calculation = "7.1";
        }
        if (rcl == 8) {
            //todo: lots
            calculation = "8";
        }

        return calculation;
    }

    /**
     * Initialize spawning for phase one rooms
     * Phase one is defined as RCL 1-4
     */
    phaseOne() {
        //I think 6 engineers is a good starting point
        for (var i = 0; i < 6; i++) {
            let memory = { "generation": 0 };
            let task = "global.Imperator.administrators[objArr[0]].supervisor.initiate({'body' : [WORK, CARRY, MOVE, MOVE], 'type': 'engineer', 'memory': objArr[1]});";
            global.TaskMaster.schedule(Game.time + (i * 10), task, [this.room, memory]);
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
        let memory = { "generation": 0 };
        let creepsToSpawn = [
            { 'body': [CARRY, CARRY, MOVE, MOVE], 'type': 'runner', 'memory': memory },
            { 'body': [WORK, WORK, WORK, WORK, CARRY, CARRY, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE], 'type': 'scholar', 'memory': memory },
            { 'body': [WORK, WORK, WORK, WORK, CARRY, CARRY, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE], 'type': 'scholar', 'memory': memory }        ]

        //! TODO: prioritization 
        for (let source of Object.keys(sources)) {
            //one miner per source
            creepsToSpawn.push({ 'body': [WORK, WORK, WORK, WORK, WORK, WORK, CARRY, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE], 'type': 'miner', 'memory': memory });
            //one courier per source
            //todo: maybe build the body based on how far the transporter has to go between container and storage
            creepsToSpawn.push({ 'body': [CARRY, CARRY, CARRY, MOVE, MOVE, MOVE], 'type': 'courier', 'memory': memory });
        }

        for (let creepToSpawn of creepsToSpawn) {
            this.getSupervisor().initiate(creepToSpawn);
        }
    }

    /**
     * Method that starts phase three, the arbiter creep
     */
    spawnArbiter() {
        let arbiter = { 
            'body': [
                CARRY, CARRY,
                MOVE, MOVE,
            ], 
            'type': 'arbiter', 
            'memory': { "generation": 0 }
        };
        
        //this is actually kinda insane
        let task = 
        `if (global.Imperator.administrators[objArr[0]].supervisor.storageLink) {
            global.Imperator.administrators[objArr[0]].supervisor.initiate(objArr[1])
        } else {
            global.TaskMaster.schedule(Game.time + 50, objArr[2], objArr);
        }`

        global.TaskMaster.schedule(Game.time, task, [this.room, arbiter, task]);
    }

    /**
     * Method that spawns a single scout creep
     */
    spawnScout() {
        this.getSupervisor().initiate({
            'body': [MOVE],
            'type': 'scout',
            'memory': {'generation' : 0}
        });
    }

    /**
     * Method that spawns an emissary to reserve a remote room
     */
    spawnEmissary(targetRoom) {
        this.getSupervisor().initiate({
            'body': [CLAIM, CLAIM, CLAIM, MOVE, MOVE, MOVE],
            'type': 'emissary',
            'memory': {'generation' : 0, 'task': 'reserve', 'targetRoom': targetRoom}
        }, false, false);
    }
}

module.exports = Executive;