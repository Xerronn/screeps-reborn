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
    initRoom(room) {
        this.administrators[room] = {};
        this.administrators[room].supervisor = new Supervisor(room);
        this.administrators[room].executive = new Executive(room);
        global.Archivist.build();
        this.refreshDominion();
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
}

module.exports = Imperator;