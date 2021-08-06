const Remotus = require("./remotus");

//creep tasked with either claiming or reserving a controller
//creep must be passed the task in memory when spawned
class Colonist extends Remotus {
    constructor(creepId) {
        super(creepId);
    }

}

module.exports = Colonist;