const Originator = require("./originator");

//highest entity, holds objects relating to rooms
class Imperator {
    constructor () {
        this.originators = {};
        this.initialize();
    }

    /**
     * Function that creates Originators for every room
     */
    initialize() {
        for (var room of Object.keys(Game.rooms)) {
            this.originators[room] = new Originator(room);
        }
    }
    /**
     * Function to refresh the live objects of everything in the game
     */
    refresh() {
        for (var room of Object.keys(this.originators)) {
            this.originators[room].refresh();
        }
    }

    /**
     * Function that runs all objects in the game
     */
    run() {
        for (var room of Object.keys(this.originators)) {
            this.originators[room].run();
        }
    }
}

module.exports = Imperator;