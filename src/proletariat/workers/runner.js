const Worker = require("./worker");

//creep that fills up extensions and towers
class Runner extends Worker {
    constructor(creepId) {
        super(creepId)
    }

    run() {
        let freeCapacity = this.store.getFreeCapacity(RESOURCE_ENERGY);
        if (freeCapacity > 0) {
            this.withdrawStorage();
        } else if (!global.Archivist.getTowersFilled(this.room)) {
            this.fillTowers();
        } else if (!global.Archivist.getExtensionsFilled(this.room)) {
            this.fillExtensions();
        }
    }
}

module.exports = Runner;