const Legionnaire = require("./legionnaire");

//creep tasked with draining a room's tower
class Scutarius extends Legionnaire {
    constructor(creepId) {
        super(creepId);

        this.update(true);
    }
}

module.exports = Scutarius;