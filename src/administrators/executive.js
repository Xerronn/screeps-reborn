//entity that manages the room
class Executive {
    constructor(room) {
        this.room = room;

        this.chemicalDesires = [];
        if (Game.rooms[this.room].controller.level == 8) {
            this.chemicalDesires = [
                RESOURCE_CATALYZED_GHODIUM_ACID,            //upgrade boost
                //RESOURCE_CATALYZED_GHODIUM_ALKALIDE,        //toughness damage reduction boost
                //RESOURCE_CATALYZED_LEMERGIUM_ALKALIDE,      //heal boost
                //RESOURCE_CATALYZED_KEANIUM_ALKALIDE,        //ranged attack boost
                //RESOURCE_CATALYZED_UTRIUM_ACID              //melee attack boost
            ];
        } else {
            //todo add more?
            this.chemicalDesires = [
                RESOURCE_GHODIUM_HYDRIDE            //tier 1 upgrade boost
            ];
        }


        this.targetChemical = undefined;
    }

    /**
     * Executive logic to run each tick
     */
    run() {
        //manage extensions filled flag
        if (Game.rooms[this.room].energyAvailable < Game.rooms[this.room].energyCapacityAvailable) {
            global.Archivist.setExtensionsFilled(this.room, false);
        }

        //check gamestage every 10 ticks
        if (Game.time % 10 == 0) {
            let calculation = global.Architect.calculateGameStage(this.room);
            let current = global.Archivist.getGameStage(this.room);
            //if gamestage is valid and different from what we have stored
            if (calculation != "-1" && current < calculation) {
                //do some architect stuff
                global.Architect.design(this.room, calculation);
                global.Archivist.setGameStage(this.room, calculation);
            }
        }

        //once gamestage 5 is active, phasetwo is in effect and dedicated builders should be spawned
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
     * Method that gets the chemical that needs to be synthesized
     */
    getTargetChemical() {
        let target = 3000; //the amount of the chemical we want in storage at all times
        for (let chemical of this.chemicalDesires) {
            if (Game.rooms[this.room].storage.store.getUsedCapacity(chemical) < target) {
                this.chemicalOrder = chemical;
                return chemical;
            }
        }
        return this.chemicalDesires[0]; //if we have target amounts of everything else, just make more of our first desire
    }

    /**
     * Method that signals the chemist to prepare for boosting or reschedules
     */
    prepareBoosts(boostTypes, boostCounts) {
        let chemists = this.getSupervisor().civitates.chemist;

        if (chemists === undefined || chemists.length == 0 || chemists[0].boosting) {
            //reschedule for in ten ticks if the chemist is not alive
            let task = "global.Imperator.administrators[objArr[0]].executive.prepareBoosts(objArr[1], objArr[2]);";
            global.TaskMaster.schedule(this.room, Game.time + 10, task, [this.room, boostTypes, boostCounts]);
            return false;
        }
        chemists[0].memory.boosting = true;
        chemists[0].memory.boostCounts = boostCounts;
        chemists[0].memory.boostTypes = boostTypes;
        return false;
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
            global.TaskMaster.schedule(this.room, Game.time + (i * 10), task, [this.room, memory]);
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
            { 'body': [WORK, WORK, WORK, WORK, CARRY, CARRY, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE], 'type': 'scholar', 'memory': memory },
            { 'body': [WORK, WORK, WORK, WORK, CARRY, CARRY, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE], 'type': 'scholar', 'memory': memory },
            { 'body': [CARRY, CARRY, MOVE, MOVE], 'type': 'runner', 'memory': memory },        ]

        //! TODO: prioritization 
        for (let source of Object.keys(sources)) {
            //one miner per source. they spawn their own courier
            creepsToSpawn.push({ 'body': [WORK, WORK, WORK, WORK, WORK, WORK, CARRY, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE], 'type': 'miner', 'memory': memory });
        }

        for (let creepToSpawn of creepsToSpawn.reverse()) {
            this.getSupervisor().initiate(creepToSpawn);
        }
    }

    /**
     * Method that starts phase three, the arbiter creep
     */
    spawnArbiter() {
        let arbiter = { 
            'body': [
                CARRY, CARRY, CARRY, CARRY
            ], 
            'type': 'arbiter', 
            'memory': { 
                "generation": 0, 
                "noRoads": true
            }
        };
        
        //this is actually kinda insane
        let task = 
        `if (global.Imperator.administrators[objArr[0]].supervisor.storageLink) {
            global.Imperator.administrators[objArr[0]].supervisor.initiate(objArr[1])
        } else {
            global.TaskMaster.schedule(objArr[0], Game.time + 50, objArr[2], objArr);
        }`

        global.TaskMaster.schedule(this.room, Game.time, task, [this.room, arbiter, task]);
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
                'memory': {'generation' : 0, 'targetRoom': targetRoom, 'noRoads': true, }
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
     * Method to spawn 4 remote engineers to bootstrap a new room
     * @param {String} targetRoom String representing the room
     */
     spawnDevelopers(targetRoom) {
        for (let i = 0; i < 4; i++) {
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
     * Method that spawns the chemist to start making boosts
     */
    spawnChemist() {
        this.getSupervisor().initiate({
            'body': [
                CARRY, CARRY, CARRY, CARRY, CARRY, CARRY,
                MOVE, MOVE, MOVE, MOVE, MOVE, MOVE
            ],
            'type': 'chemist',
            'memory': {'generation':0}
        });
    }

    //Military Creep spawning

    /**
     * Method that spawns an executioner to destroy a low level room <7 rcl
     */
    spawnExecutioner(targetRoom, boost=true, task='execute') {
        let executionerBody;
        if (task == 'execute') {      
            executionerBody = [
                TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, 
                RANGED_ATTACK, RANGED_ATTACK, RANGED_ATTACK, RANGED_ATTACK, 
                RANGED_ATTACK, RANGED_ATTACK, RANGED_ATTACK, RANGED_ATTACK, 
                HEAL, HEAL, HEAL, HEAL, HEAL, HEAL, HEAL, HEAL,
                MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE,
                MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE
            ];
        } else {
            if (global.Archivist.getGarrisonSpawned(this.room)) return;
            executionerBody = [
                ATTACK, ATTACK, ATTACK, ATTACK, ATTACK, ATTACK, ATTACK, ATTACK, ATTACK, ATTACK,
                ATTACK, ATTACK, ATTACK, ATTACK, ATTACK, ATTACK, ATTACK, ATTACK, ATTACK, ATTACK,
                MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE
            ];
            global.Archivist.setGarrisonSpawned(this.room, true);
        }
        this.getSupervisor().initiate({
            'body': executionerBody,
            'type': 'executioner',
            'memory': {'targetRoom': targetRoom, 'noRoads': true, 'task': task}
        }, boost);
    }

    /**
     * Method that spawns a simple harass creep for an enemy's remote mine
     */
     spawnJester(targetRoom) {
        this.getSupervisor().initiate({
            'body': [
                ATTACK, MOVE, MOVE
            ],
            'type': 'jester',
            'memory': {'targetRoom': targetRoom, 'noRoads': true, 'generation': 0}
        });
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
                    ATTACK, ATTACK, ATTACK, ATTACK, 
                    RANGED_ATTACK, RANGED_ATTACK, RANGED_ATTACK,
                    HEAL, HEAL, HEAL
                ],
                'type': 'garrison',
                'memory': {'targetRoom': targetRoom}
            });
            global.Archivist.setGarrisonSpawned(this.room, true);
        }
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