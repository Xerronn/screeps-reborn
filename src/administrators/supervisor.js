//workers
const Miner = require("../civitas/workers/miner");
const Engineer = require("../civitas/workers/engineer");
const Courier = require("../civitas/workers/courier");
const Scholar = require("../civitas/workers/scholar");
const Runner = require("../civitas/workers/runner");
const Contractor = require("../civitas/workers/contractor");
const Arbiter = require("../civitas/workers/arbiter");
const Excavator = require("../civitas/workers/excavator");
const Chemist = require("../civitas/workers/chemist");

//remote workers
const Scout = require("../civitas/workers/remote/scout");
const Emissary = require("../civitas/workers/remote/emissary");
const Prospector = require("../civitas/workers/remote/prospector");
const Curator = require("../civitas/workers/remote/curator");
const Hauler = require("../civitas/workers/remote/hauler");
const Developer = require("../civitas/workers/remote/developer");

//legionnaire
const Scutarius = require("../civitas/legion/scutarius");
const Physician = require("../civitas/legion/physician");
const Garrison = require("../civitas/legion/garrison");
const Executioner = require("../civitas/legion/executioner");

//castrum
const Nexus = require("../castrum/nexus");
const Bastion = require("../castrum/bastion");
const Conduit = require("../castrum/conduit");
const Workshop = require("../castrum/workshop");
const Market = require("../castrum/market");

//entity that initializes, refreshes, runs all roomObj in a room
class Supervisor {
    constructor(room) {
        this.room = room;
        this.civitates = {};
        this.castrum = {};

        this.reservedTickNexus = 0;

        this.reservedTickWorkshop = 0;

        //special link roles
        this.controllerLink;
        this.storageLink;

        //special lab roles
        this.reagentWorkshops = [];
        this.productWorkshops = [];
    }

    /**
     * Function that wraps all gameObj in the room with a wrapper class
     */
    wrap(onlyStructures = false) {
        //todo: make it initialize structures from archivist maybeeee
        let thisRoom = Game.rooms[this.room];
        //initialize all structures in the room to their respective classes
        this.castrum = {};
        for (var struc of thisRoom.find(FIND_MY_STRUCTURES)) {
            switch (struc.structureType) {
                case STRUCTURE_SPAWN:
                    //init the list in the dictionary if it doesn't exist
                    !("nexus" in this.castrum) && (this.castrum["nexus"] = []);
                    this.castrum["nexus"].push(new Nexus(struc.id));
                    break;
                
                case STRUCTURE_TOWER:
                    !("bastion" in this.castrum) && (this.castrum["bastion"] = []);
                    this.castrum["bastion"].push(new Bastion(struc.id));
                    break;

                case STRUCTURE_LINK:
                    !("conduit" in this.castrum) && (this.castrum["conduit"] = []);
                    //keep track of special link roles
                    this.castrum["conduit"].push(new Conduit(struc.id));
                    break;

                case STRUCTURE_LAB:
                    !("workshop" in this.castrum) && (this.castrum["workshop"] = []);
                    this.castrum["workshop"].push(new Workshop(struc.id));
                    break;

                case STRUCTURE_TERMINAL:
                    !("market" in this.castrum) && (this.castrum["market"] = []);
                    this.castrum["market"].push(new Market(struc.id));
                    break;
            }
        }

        if (onlyStructures) return;

        //initialize all creeps in the room to their respective classes
        this.civitates = {};
        for (let creepMem of _.filter(Memory.creeps, c => c.spawnRoom == this.room)) {
            !(creepMem.type in this.civitates) && (this.civitates[creepMem.type] = []);

            if (Game.creeps[creepMem.name]) {
                let createObjStr = "this.civitates[\"" + creepMem.type + "\"].push(new " + creepMem.type.charAt(0).toUpperCase() + 
                    creepMem.type.slice(1) + "(Game.creeps[\"" + creepMem.name + "\"].id));";

                eval(createObjStr);
            } else {
                //the creep is dead. This should only happen if a creep dies on the same tick as a global reset.
                //if it is a rebirth creep, rebirth it, otherwise delete the memory
                if (creepMem.generation !== undefined) {
                    let template = {
                        "body": creepMem.body,
                        "type": creepMem.type,
                        "memory": creepMem
                    };
                    this.initiate(template);
                }
                delete Memory.creeps[creepMem.name];
            }
        }
    }

    /**
     * Function that updates all stored GameObj with live references.
     * Should be run each tick in the main loop
     */
     refresh() {
        //refresh the live game object reference for every creep
        for (var type of Object.keys(this.civitates)) {
            for (var pro of this.civitates[type]) {
                pro.update();
            }
        }

        //refresh the live game object reference for every structure
        for (var type of Object.keys(this.castrum)) {
            for (var struc of this.castrum[type]) {
                struc.update();
            }
        }
    }

    /**
     * Function that runs all objects in the room
     */
     run() {
        try {
            //first all creeps
            for (var type of Object.keys(this.civitates)) {
                for (var pro of this.civitates[type]) {
                    let startcpu = Game.cpu.getUsed()
                    pro.run();
                    let usedCpu = Game.cpu.getUsed() - startcpu;
                    
                    if (usedCpu > 0.3 && global.logger == true) {
                        console.log(pro.name);
                        console.log(usedCpu);
                    }
                }
            }

            //then all structures
            for (var type of Object.keys(this.castrum)) {
                for (var struc of this.castrum[type]) {
                    //block workshops from running when they are reserved
                    if (type !== "workshop" || this.reservedTickWorkshop < Game.time) {
                        struc.run();
                    }
                }
            }
        } catch (roomErr) {
            let errorMessage = `<b style='color:red;'>Room FAILURE with message ${roomErr.message} at ${roomErr.stack}</b>`
            console.log(errorMessage);
            if (Game.time % 30 == 0) {
                Game.notify(errorMessage);
            }
        }
    }

    /**
     * Function that takes a creep object and makes a new creep based on that object
     * @param {Object} template An object that contains body, type, and memory
     * @param {boolean} rebirth whether or not this is a rebirth
     */
    initiate(template) {
        //to make sure that we actually find a nexus that can spawn this request.
        let foundNexus = false;
        let generationIncremented = 0;

        if (this.reservedTickNexus < Game.time) {
            //loop through the spawns until an available one is found
            for (let nexus of this.castrum["nexus"]) {
                if (!nexus.spawning && !nexus.spawningThisTick) {

                    //arbiters must be spawned from the prime nexus
                    if (template.type == "arbiter") {
                        if (!nexus.prime) continue;
                    }
                    foundNexus = true;
                    
                    //use the body stored in memory if it exists, as it can contain evolutions
                    let newBody = template.memory.body;
                    if (!newBody) {
                        newBody = template.body;
                    }

                    if (template.memory.generation !== undefined) {
                        template.memory.generation++;
                        generationIncremented++;
                    }

                    //handle if the creep will be boosted when it spawns
                    let boostType = this.prepareBoosts(template.type, newBody);
                    if (boostType !== undefined) {
                        template.memory.boost = boostType;
                    }

                    let success = nexus.spawnCreep(newBody, template.type, { ...template.memory });
    
                    if (success == OK) {
                        //don't try spawning on another spawn
                        break;
                    } else {
                        //so we can reschedule
                        foundNexus = false;
                    }
                }
            }
        }

        if (!foundNexus) {
            //decrement it back down
            if (template.memory.generation !== undefined) {
                template.memory.generation -= generationIncremented;
            }
            //if the request fails, schedule it for 5 ticks in the future
            let task = "global.Imperator.administrators[objArr[0]].supervisor.initiate(objArr[1]);";
            global.TaskMaster.schedule(this.room, Game.time + 5, task, [this.room, {...template}]);
        }
    }

    /**
     * Method that gets the chemist to prepare for boosting a creep and returns the type of boost
     * @param {String} creepType role of the creep
     * @returns the boost type for the role
     */
    prepareBoosts(creepType, body) {
        let rcl = Game.rooms[this.room].controller.level;

        let boostTypes;
        if (rcl === 7) {
            switch (creepType) {
                case 'scholar':
                    boostTypes = [RESOURCE_GHODIUM_HYDRIDE];
                    break;
            }
        } else if (rcl === 8) {
            switch (creepType) {
                case 'scholar':
                    boostTypes = [RESOURCE_CATALYZED_GHODIUM_ACID];
                    break;
            }
        }
        if (boostTypes === undefined) {
            return undefined;
        }

        let boostCount = 0;
        let partType;
        for (let part in BOOSTS) {
            if (Object.keys(BOOSTS[part]).includes(boostTypes)) {
                partType = part;
                break;
            }
        }

        let numParts = 0;
        for (let part of body) {
            if (part == partType) {
                numParts++;
            }
        }

        boostCount = numParts * 30;

        this.getExecutive().prepareBoosts(boostTypes, boostCount);
        return boostTypes;
    }

    /**
     * Delete the class holding the dead creep
     * @param {Civitas} civitates 
     */
    dismiss(civitatesType) {
        //If the creep is replacing a dead creep, we delete it from memory
        let origArr = this.civitates[civitatesType.type];
        let index = origArr.indexOf(civitatesType);
        if (index >= 0) origArr.splice(index, 1);
        //todo: we can use the absence of this to see when we missed a creep due to global reset
        delete Memory.creeps[civitatesType.memory.name];
    }

    /**
     * Delete the class holding the dead tower
     * @param {Castrum} castrumType
     */
    decommission(castrumType) {
        let origArr = this.castrum[castrumType.type];
        let index = origArr.indexOf(castrumtype);
        if (index >= 0) origArr.splice(index, 1);
    }

    /**
     * Function to wrap a newly created creep
     * @param {String} creepName Name of the creep
     */
    wrapCreep(creepName) {
        let creep = Game.creeps[creepName];
        if (!this.civitates[creep.memory.type]) {
            this.civitates[creep.memory.type] = [];
        }
        //check if the creep has already been wrapped
        if (!global.Imperator.getWrapper(creep.id)) {
            let createObjStr = "this.civitates[\"" + creep.memory.type + "\"].push(new " + creep.memory.type.charAt(0).toUpperCase() + 
                creep.memory.type.slice(1) + "(Game.creeps[\"" + creep.name + "\"].id));";

            eval(createObjStr);
        }
    }

    /**
     * Method to block spawning for 5 ticks
     */
    reserveNexus() {
        this.reservedTickNexus = Game.time + 5;
    }

    /**
     * Method to block workshops for 5 ticks
     */
    reserveWorkshop() {
        this.reservedTickWorkshop = Game.time + 5;
    }

    /**
     * function to return the room's executive
     * @returns Executive
     */
    getExecutive() {
        return global.Imperator.administrators[this.room].executive;
    }
}

module.exports = Supervisor;