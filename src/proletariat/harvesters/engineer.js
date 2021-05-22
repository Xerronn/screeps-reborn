const Harvester = require("./harvester");

//creep tasked with early colony management.
//get energy in any way possible and lay the foundations
//used until rc3

//creep tasked with harvesting sources
class Engineer extends Harvester {
    constructor(creepId) {
        super(creepId);
        
    }
}

module.exports = Engineer;