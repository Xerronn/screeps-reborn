const Remotus = require("../workers/remote/remotus");

//the parent combat creep definition
//must be passed a targetRoom in memory
class Legionnaire extends Remotus {
    constructor(creepId) {
        super(creepId);

        this.update(true);
    }
}

module.exports = Legionnaire;