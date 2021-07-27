const Miner = require("../proletariat/workers/miner");
const Engineer = require("../proletariat/workers/engineer");
const Courier = require("../proletariat/workers/courier");
const Professor = require("../proletariat/workers/professor");
const Runner = require("../proletariat/workers/runner");
const Contractor = require("../proletariat/workers/contractor");

const Nexus = require("../constructs/nexus");
const Bastion = require("../constructs/bastion")

//entity that initializes, refreshes, runs all roomObj in a room
class Supervisor {
    constructor(room) {
        this.room = room;
        this.proletarian = {};
        this.constructs = {};
    }

    /**
     * Function that wraps all gameObj in the room with a wrapper class
     */
    wrap(onlyStructures = false) {
        //todo: make it initialize structures from archivist maybeeee
        let thisRoom = Game.rooms[this.room];
        //initialize all structures in the room to their respective classes
        this.constructs = {};
        for (var struc of thisRoom.find(FIND_MY_STRUCTURES)) {
            switch (struc.structureType) {
                case STRUCTURE_SPAWN:
                    //init the list in the dictionary if it doesn't exist
                    !("nexus" in this.constructs) && (this.constructs["nexus"] = []);
                    this.constructs["nexus"].push(new Nexus(struc.id));
                    break;
                
                case STRUCTURE_TOWER:
                    !("bastion" in this.constructs) && (this.constructs["bastion"] = []);
                    this.constructs["bastion"].push(new Bastion(struc.id));
                    break;
            }
        }

        if (onlyStructures) return;

        //initialize all creeps in the room to their respective classes
        this.proletarian = {};
        for (let creepMem of _.filter(Memory.creeps, c => c.spawnRoom == this.room && !c.spawning)) {
            !(creepMem.type in this.proletarian) && (this.proletarian[creepMem.type] = []);

            if (Game.creeps[creepMem.name]) {
                let createObjStr = "this.proletarian[\"" + creepMem.type + "\"].push(new " + creepMem.type.charAt(0).toUpperCase() + 
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
        for (var type of Object.keys(this.proletarian)) {
            for (var pro of this.proletarian[type]) {
                pro.update();
            }
        }

        //refresh the live game object reference for every structure
        for (var type of Object.keys(this.constructs)) {
            for (var struc of this.constructs[type]) {
                struc.update();
            }
        }
    }

    /**
     * Function that runs all objects in the room
     */
     run() {
        //first all creeps
        for (var type of Object.keys(this.proletarian)) {
            for (var pro of this.proletarian[type]) {
                pro.run();
            }
        }

        //then all structures
        for (var type of Object.keys(this.constructs)) {
            for (var struc of this.constructs[type]) {
                struc.run();
            }
        }
    }

    /**
     * Function that takes a creep object and makes a new creep based on that object
     * @param {Object} template An object that contains body, type, and memory
     * @param {boolean} rebirth whether or not this is a rebirth
     */
     initiate(template, rebirth = false) {
        //to make sure that we actually find a nexus that can spawn this request.
        let foundNexus = false;
        //loop through the spawns until an available one is found
        for (let nexus of this.constructs["nexus"]) {
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
            let task = "global.Imperator.administrators[objArr[1]].supervisor.initiate(objArr[0]);";
            global.TaskMaster.schedule(Game.time + 20, task, [{ ...template }, this.room]);
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
        let origArr = this.proletarian[proletarianType.type];
        let index = origArr.indexOf(proletarianType);
        if (index >= 0) origArr.splice(index, 1);
        //todo: we can use the absence of this to see when we missed a creep due to global reset
        delete Memory.creeps[proletarianType.memory.name];
    }

    /**
     * Function to wrap a newly created creep
     * @param {String} creepName Name of the creep
     */
    wrapCreep(creepName) {
        let creep = Game.creeps[creepName];
        if (!this.proletarian[creep.memory.type]) {
            this.proletarian[creep.memory.type] = [];
        }
        let createObjStr = "this.proletarian[\"" + creep.memory.type + "\"].push(new " + creep.memory.type.charAt(0).toUpperCase() + 
                    creep.memory.type.slice(1) + "(Game.creeps[\"" + creep.name + "\"].id));";

        eval(createObjStr);
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