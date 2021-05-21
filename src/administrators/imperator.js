const Originator = require("./originator");
const Initiator = require("./initiator");

//highest entity, holds objects relating to rooms
class Imperator {
    constructor () {
        this.administrators = {};
        this.dominion = _.filter(Game.rooms, room => room.controller && room.controller.my).map(room => room.name);
        this.initialize();
    }

    /**
     * Function that creates Originators for every room
     */
    initialize() {
        //make an originator for every room that we own
        for (var room of this.dominion) {
            !(room in this.administrators) && (this.administrators[room] = {});
            this.administrators[room].originator = new Originator(room);
            this.administrators[room].initiator = new Initiator(room);
        }
    }
    /**
     * Function to refresh the live objects of everything in the game
     */
    refresh() {
        for (var room of this.dominion) {
            this.administrators[room].originator.refresh();
        }
    }

    /**
     * Function that runs all objects in the game
     */
    run() {
        for (var room of this.dominion) {
            this.administrators[room].originator.run();
        }
    }
}

module.exports = Imperator;