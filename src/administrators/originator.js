const Miner = require("../proletariat/workers/miner");
const Engineer = require("../proletariat/workers/engineer");
const Nexus = require("../constructs/nexus");
const Bastion = require("../constructs/bastion")

//entity that initializes, refreshes, runs all roomObj in a room
class Originator {
    constructor(room) {
        this.room = room;
        this.proletarian = {};
        this.constructs = {};
    }

    /**
     * Function that initializes the Originator with all GameObj
     */
    initialize() {
        //todo: make it initialize structures from archivist
        let thisRoom = Game.rooms[this.room];
        //initialize all structures in the room to their respective classes
        for (var struc of thisRoom.find(FIND_MY_STRUCTURES)) {
            switch(struc.structureType) {
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

        //initialize all creeps in the room to their respective classes
        for (let creepMem of _.filter(Memory.creeps, c => c.spawnRoom == this.room && !c.spawning)) {
            !(creepMem.type in this.proletarian) && (this.proletarian[creepMem.type] = []);

            if (Game.creeps[creepMem.name]) {
                let createObjStr = "this.proletarian[\"" + creepMem.type + "\"].push(new " + creepMem.type.charAt(0).toUpperCase() + 
                    creepMem.type.slice(1) + "(Game.creeps[\"" + creepMem.name + "\"].id));";

                eval(createObjStr);
            } else {
                //the creep is dead. This should only happen if a creep dies on the same tick as a global reset.
                //if it is a rebirth creep, rebirth it, otherwise delete the memory
                if (creepMem.generation != null) {
                    let template = {
                        "body": creepMem.body,
                        "type": creepMem.type,
                        "memory": creepMem
                    };
                    this.getInitiator().initiate(template, true);
                } else {
                    delete Memory.creeps[creepMem.name];
                }
            }
        }
    }

    /**
     * Function to initialize a newly created creep
     * @param {String} creepName Name of the creep
     */
    initializeCreep(creepName) {
        let creep = Game.creeps[creepName];
        if (!this.proletarian[creep.memory.type]) {
            this.proletarian[creep.memory.type] = [];
        }
        let createObjStr = "this.proletarian[\"" + creep.memory.type + "\"].push(new " + creep.memory.type.charAt(0).toUpperCase() + 
                    creep.memory.type.slice(1) + "(Game.creeps[\"" + creep.name + "\"].id));";

        eval(createObjStr);
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
     * function to return the room's initiator
     * @returns Initiator
     */
    getInitiator() {
        return global.Imperator.administrators[this.room].initiator;
    }
}

module.exports = Originator;