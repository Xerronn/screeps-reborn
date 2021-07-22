const Construct = require("./construct");

//tower entity
class Bastion extends Construct {
    constructor(towerId) {
        super(towerId);

    }

    run() {
        if (this.store.getFreeCapacity(RESOURCE_ENERGY) > this.store.getCapacity(RESOURCE_ENERGY) / 4) {
            global.Archivist.setTowersFilled(this.room, false);
        }
    }
}

module.exports = Bastion;