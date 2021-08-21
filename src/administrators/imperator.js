const Supervisor = require("./supervisor");
const Executive = require("./executive");

//highest entity, holds objects relating to rooms
class Imperator {
    constructor () {
        this.administrators = {};
        this.refreshDominion();
    }

    /**
     * Function that creates Supervisors for every room
     */
    initialize() {
        //make an supervisor for every room that we own
        for (let room of this.dominion) {
            !(room in this.administrators) && (this.administrators[room] = {});
            this.administrators[room].supervisor = new Supervisor(room);
            this.administrators[room].executive = new Executive(room);
        }
        //it is important to get through the creation of the objects before referencing them. idiot
        for (let room of this.dominion) {
            this.administrators[room].supervisor.wrap();
        }
    }

    /**
     * Method that creates a supervisor and executive for a newly claimed room
     * @param {String} room String representing the room
     */
    initRoom(room, originRoom) {
        this.administrators[room] = {};
        this.administrators[room].supervisor = new Supervisor(room);
        this.administrators[room].executive = new Executive(room);
        global.Archivist.build();
        this.refreshDominion();
        this.administrators[originRoom].executive.spawnDevelopers(room);
    }

    /**
     * Function to refresh the live objects of everything in the game
     */
    refresh() {
        for (let room of this.dominion) {
            this.administrators[room].supervisor.refresh();
        }
    }

    /**
     * Function that runs all objects in the game
     */
    run() {
        for (let room of this.dominion) {
            this.administrators[room].supervisor.run();
            this.administrators[room].executive.run();
        }
    }

    /**
     * Method to update the imperator's dominion to current
     */
    refreshDominion() {
        this.dominion = _.filter(Game.rooms, room => room.controller && room.controller.my).map(room => room.name);
    }

    /**
     * Method that returns the wrapper for a given game object
     * @param {String} id 
     */
     getWrapper(id) {
        let liveObj = Game.getObjectById(id);
        if (!liveObj) {
            return undefined;
        }

        let room = liveObj.room;

        if (liveObj.structureType !== undefined) {
            //is a structure
            let supervisor = global.Imperator.administrators[room.name].supervisor;
            let structures = supervisor.castrum[global.Illustrator.mapGameToClass(liveObj.structureType)]
            for (let struc of structures) {
                if (struc.id == id) {
                    return struc;
                }
            }
            return undefined;
        } else {
            //is a creep
            let supervisor = global.Imperator.administrators[liveObj.memory.spawnRoom].supervisor;
            let creeps = supervisor.civitates[liveObj.memory.type]
            for (let creep of creeps) {
                if (creep.id == id) {
                    return creep;
                }
            }
            return undefined;
        }
    }
}

module.exports = Imperator;