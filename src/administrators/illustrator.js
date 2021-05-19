//entity that caches all of our class definitions in the global scope
//didn't work out. Might need later though.
class Illustrator {
    constructor() {
        this.initialize();
    }

    initialize() {
        global.classes = {}
        global.classes.constructs = {}
        global.classes.proletariat = {}

        global.classes.gameObj = require("../gameObj");

        global.classes.proletariat.proletarian = require("../proletariat/proletarian");
        global.classes.proletariat.archon = require("../proletariat/archon");

        global.classes.constructs.construct = require("../constructs/construct");
        global.classes.constructs.nexus = require("../constructs/nexus");
        global.classes.constructs.aegis = require("../constructs/aegis");

        return "<Global Reset at " + Game.time + " >";
    }
}

module.exports = Illustrator;