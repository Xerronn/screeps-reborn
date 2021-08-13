//workers
const Miner = require("../civitas/workers/miner");
const Engineer = require("../civitas/workers/engineer");
const Courier = require("../civitas/workers/courier");
const Scholar = require("../civitas/workers/scholar");
const Runner = require("../civitas/workers/runner");
const Contractor = require("../civitas/workers/contractor");
const Arbiter = require("../civitas/workers/arbiter");

//remote workers
const Scout = require("../civitas/workers/remote/scout");
const Emissary = require("../civitas/workers/remote/emissary");
const Prospector = require("../civitas/workers/remote/prospector");
const Curator = require("../civitas/workers/remote/curator");
const Hauler = require("../civitas/workers/remote/hauler");

//legionnaire
const Scutarius = require("../civitas/legion/scutarius");
const Physician = require("../civitas/legion/physician");
const Garrison = require("../civitas/legion/garrison");

//castrum
const Nexus = require("../castrum/nexus");
const Bastion = require("../castrum/bastion");
const Conduit = require("../castrum/conduit");

//entity that initializes, refreshes, runs all roomObj in a room
class Supervisor {
    constructor(room) {
        this.room = room;
        this.civitates = {};
        this.castrum = {};

        this.reservedTick = 0;
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
                    if (!this.controllerLink) {
                        this.controllerLink = "none";
                        this.storageLink = "none";
                    }
                    this.castrum["conduit"].push(new Conduit(struc.id));
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
                    this.initiate(template, true);
                } else {
                    delete Memory.creeps[creepMem.name];
                }
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
        //first all creeps
        for (var type of Object.keys(this.civitates)) {
            for (var pro of this.civitates[type]) {
                pro.run();
            }
        }

        //then all structures
        for (var type of Object.keys(this.castrum)) {
            for (var struc of this.castrum[type]) {
                struc.run();
            }
        }
    }

    /**
     * Function that takes a creep object and makes a new creep based on that object
     * @param {Object} template An object that contains body, type, and memory
     * @param {boolean} rebirth whether or not this is a rebirth
     */
     initiate(template, rebirth=false) {
        //to make sure that we actually find a nexus that can spawn this request.
        let foundNexus = false;

        if (this.reservedTick < Game.time) {
            //loop through the spawns until an available one is found
            for (let nexus of this.castrum["nexus"]) {
                if (!nexus.spawning && !nexus.spawningThisTick) {
                    foundNexus = true;
                    
                    //use the body stored in memory if it exists, as it can contain evolutions
                    let newBody = template.memory.body;
                    if (!newBody) {
                        newBody = template.body;
                    }
                    let success = nexus.spawnCreep(newBody, template.type, { ...template.memory });

                    //if the request fails, schedule it for 20 ticks in the future
                    if (success == OK) {
                        if (template.memory.generation !== undefined) {
                            template.memory.generation++;
                        }
                        break;
                    } else {
                        //so we can reschedule
                        foundNexus = false;
                    }
                }
            }
        }

        if (!foundNexus) {
            let task = "global.Imperator.administrators[objArr[0]].supervisor.initiate(objArr[1]);";
            global.TaskMaster.schedule(Game.time + 20, task, [this.room, { ...template }]);
        }

        //if this is a rebirth, delete the old wrapper
        if (rebirth) {
            this.dismiss(template);
        }
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
        if (!global.Illustrator.getWrapper(creep.id)) {
            let createObjStr = "this.civitates[\"" + creep.memory.type + "\"].push(new " + creep.memory.type.charAt(0).toUpperCase() + 
                creep.memory.type.slice(1) + "(Game.creeps[\"" + creep.name + "\"].id));";

            eval(createObjStr);
        }
    }

    /**
     * Method to block spawning for 5 ticks
     */
     reserve() {
        this.reservedTick = Game.time + 5;
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