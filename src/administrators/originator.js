const Archon = require("../proletariat/harvesters/archon");
const Harvester = require("../proletariat/harvesters/harvester");
const Nexus = require("../constructs/nexus");

//entity that initializes, refreshes, runs all roomObj in a room
class Originator {
    constructor(room) {
        this.room = room;
        this.proletarian = {};
        this.constructs = {};
        this.initialize();
    }

    /**
     * Function that initializes the Originator with all GameObj
     */
    initialize() {
        let thisRoom = Game.rooms[this.room];
        //initialize all creeps in the room to their respective classes
        //todo: What if a global reset happens when a creep is in a different room
        for (var creep of thisRoom.find(FIND_MY_CREEPS)) {
            switch(creep.memory.type) {
                case "archon":
                    //init the list in the dictionary if it doesn't exist
                    !("archon" in this.proletarian) && (this.proletarian["archon"] = []);
                    this.proletarian["archon"].push(new Archon(creep.id));
                    break;
                case "harvester":
                    !("harvester" in this.proletarian) && (this.proletarian["harvester"] = []);
                    this.proletarian["harvester"].push(new Harvester(creep.id));
                    break;
            }
        }

        //initialize all structures in the room to their respective classes
        for (var struc of thisRoom.find(FIND_MY_STRUCTURES)) {
            switch(struc.structureType) {
                case STRUCTURE_SPAWN:
                    //init the list in the dictionary if it doesn't exist
                    !("nexus" in this.constructs) && (this.constructs["nexus"] = []);
                    this.constructs["nexus"].push(new Nexus(struc.id));
                    break;
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
}

module.exports = Originator;