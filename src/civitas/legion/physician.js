const Legionnaire = require("./legionnaire");

//creep tasked with healing.
//can be linked to a specific creep or just general medic
class Physician extends Legionnaire {
    constructor(creepId) {
        super(creepId);

        this.update(true);
    }
}

module.exports = Physician;