//entity that manages the room
class Executive {
    constructor(room) {
        this.room = room;
    }

    /**
     * Exectuive logic to run each tick
     */
    run() {
        //manage extensions filled flag
        if (Game.rooms[this.room].energyAvailable < Game.rooms[this.room].energyCapacityAvailable) {
            global.Archivist.setExtensionsFilled(this.room, false);
        }

        //check gamestage every 10 ticks
        if (Game.time % 10 == 0) {
            let calculation = this.calculateGameStage(this.room);
            let current = global.Archivist.getGameStage(this.room);
            //if gamestage is valid and different from what we have stored
            if (calculation != "-1" && current < calculation) {
                //do some architect stuff
                global.Architect.design(this.room, calculation);
                global.Archivist.setGameStage(this.room, calculation);
            }
        }

        //once gamestage 5 is active, phasetwo is in effect
        let gameStage = parseFloat(global.Archivist.getGameStage(this.room));
        if (gameStage >= 4.1) {
            if (Game.rooms[this.room].find(FIND_MY_CONSTRUCTION_SITES).length > 0) {
                let contractors = global.Archivist.getNumContractors(this.room);

                if (contractors === undefined) {
                    contractors = 0;
                }

                let numToSpawn = 2;
                let spawnBody = [
                    WORK, WORK, WORK, WORK,
                    CARRY, CARRY, CARRY, CARRY,
                    MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE
                ]

                //once we reach rcl 7, we downscale to a single double powerful contractor
                if (gameStage >= 7) {
                    numToSpawn = 1;
                    spawnBody = [
                        WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK,
                        CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY,
                        MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE,
                        MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE
                    ]
                }

                if (contractors < numToSpawn) {
                    this.getSupervisor().initiate({
                        'body': spawnBody,
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
        if (rcl == 4 && liveRoom.storage && liveRoom.storage.my) {
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
            //time to start scouting and spawn the excavator
            calculation = "6.3";
        }
        if (rcl == 6 && currentStage == "6.3" && global.Archivist.getDoneScouting(this.room) == true) {
            //time to build road to the remote
            calculation = "6.4";
        }
        if (rcl == 6 && currentStage == "6.4" && liveRoom.find(FIND_MY_CONSTRUCTION_SITES).length == 0) {
            //time to build the insides of the remote and miners
            calculation = "6.5";
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
            //one miner per source. they spawn their own courier
            creepsToSpawn.push({ 'body': [WORK, WORK, WORK, WORK, WORK, WORK, CARRY, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE], 'type': 'miner', 'memory': memory });
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
            'memory': {'generation' : 0, 'noRoads': true}
        });
    }

    /**
     * Method that spawns an emissary to either claim a new room or reserve a remote room
     * @param {String} task either 'reserve' or 'claim'
     */
    spawnEmissary(targetRoom, task='reserve') {
        let body;
        if (task == 'reserve') {
            body = [CLAIM, CLAIM, CLAIM, MOVE, MOVE, MOVE];
        } else {
            body = [CLAIM, MOVE, MOVE, MOVE, MOVE, MOVE];
        }
        this.getSupervisor().initiate({
            'body': body,
            'type': 'emissary',
            'memory': {'generation' : 0, 'task': task, 'targetRoom': targetRoom, 'noRoads': true}
        });
    }

    /**
     * Method that spawns the two miners that will build the roads and containers in the remote
     * @param {String} targetRoom string representing the room they should move to first
     */
    spawnProspectors(targetRoom) {
        for (let i = 0; i < 2; i++) {
            this.getSupervisor().initiate({
                'body': [WORK, WORK, WORK, WORK, WORK, WORK, CARRY, CARRY, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE],
                'type': 'prospector',
                'memory': {'generation' : 0, 'targetRoom': targetRoom, 'noRoads': true}
            });
        }
    }

    /**
     * Method that spawns the two miners that will build the roads and containers in the remote
     * @param {String} targetRoom string representing the room they should move to first
     */
     spawnCurator(targetRoom) {
        if (!global.Archivist.getCuratorSpawned(this.room)) {
            this.getSupervisor().initiate({
                'body': [WORK, WORK, WORK, WORK, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE],
                'type': 'curator',
                'memory': {'generation' : 0, 'targetRoom': targetRoom}
            });
            global.Archivist.setCuratorSpawned(this.room, true);
        }
    }

    /**
     * Method that spawns defenders for remote rooms
     * @param {String} targetRoom string representing the room
     */
    spawnGarrison(targetRoom) {
        if (!global.Archivist.getGarrisonSpawned(this.room)) {
            this.getSupervisor().initiate({
                'body': [
                    TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, 
                    ATTACK, ATTACK, ATTACK, ATTACK, ATTACK, RANGED_ATTACK, 
                    HEAL, HEAL, HEAL
                ],
                'type': 'garrison',
                'memory': {'targetRoom': targetRoom}
            });
            global.Archivist.setGarrisonSpawned(this.room, true);
        }
    }

    /**
     * Method to spawn a remote engineer
     * @param {String} targetRoom String representing the room
     */
     spawnDevelopers(targetRoom) {
        for (let i = 0; i < 2; i++) {
            this.getSupervisor().initiate({
                'body': [
                    WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK,
                    CARRY, CARRY, CARRY, CARRY, CARRY,
                    MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE,
                    MOVE, MOVE, MOVE, MOVE, MOVE
                ],
                'type': 'developer',
                'memory': {'generation':0, 'targetRoom': targetRoom, 'noRoads': true}
            });
        }
    }

    /**
     * Method that spawns the excavator to mine out minerals
     */
    spawnExcavator() {
        this.getSupervisor().initiate({
            'body': [
                WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK,
                WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK,
                MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE,
                MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE,
            ],
            'type': 'excavator',
            'memory': {'generation':0}
        });
    }

    /**
     * Method that removes one of the scholars and two haulers upon reaching rcl 7 and max creeps are available
     */
    downscale() {
        let supervisor = this.getSupervisor();
        // delete supervisor.civitates.scholar[0].memory.generation;
        let haulers = supervisor.civitates.hauler;

        let sources = [];
        for (let hauler of haulers) {
            if (!sources.includes(hauler.memory.source)) {
                sources.push(hauler.memory.source);
                delete hauler.memory.generation;
            } else {
                //make the hauler bigger to make up for the loss of his buddy
                //lose out on some energy, but the cpu savings are worth it
                hauler.evolve();
            }
        }
    }
}

module.exports = Executive;