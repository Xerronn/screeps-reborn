const Construct = require("./construct");

//wrapper class for link object
class Conduit extends Construct () {
    constructor(linkId) {
        super(linkId);

        //check if the link is within 2 squares of either a controller or storage
        let nearestBuilding = this.pos.findClosestByRange(FIND_STRUCTURES, {
            filter: (structure) => {
                return structure.structureType != STRUCTURE_LINK
                    && [STRUCTURE_STORAGE, STRUCTURE_CONTROLLER].includes(structure.structureType)
                    && link.pos.inRangeTo(structure, 2)
            }
        });

        //if it isn't it is a fill type link(does nothing but receive)
        if (nearestBuilding) {
            let sType = nearestBuilding.structureType;
            this.type = sType;

            //set supervisor link references for roles
            if (sType == STRUCTURE_STORAGE) {
                global.Imperator.administrators[this.room].supervisor.controllerLink = this;
            } else {
                global.Imperator.administrators[this.room].supervisor.storageLink = this;
            }
        } else {
            this.type = "fill";
        }
    }

    /**
     * link logic run each tick
     */
    run() {
        let controllerLink = global.Imperator.administrators[this.room].supervisor.controllerLink;
        let storageLink = global.Imperator.administrators[this.room].supervisor.storageLink;
        try {
            switch (this.type) {
                case STRUCTURE_STORAGE:
                    if (this.store.getUsedCapacity(RESOURCE_ENERGY) >= 200 && controllerLink) {
                        if (controllerLink.store.getUsedCapacity(RESOURCE_ENERGY) < 650) {
                            this.liveObj.transferEnergy(controllerLink.liveObj);
                        }
                    }
                    break;
                case STRUCTURE_CONTAINER:
                case "fill":
                    if (this.store.getFreeCapacity(RESOURCE_ENERGY) <= 400 && storageLink) {
                        if (storageLink.store.getFreeCapacity(RESOURCE_ENERGY) != 0) {
                            this.liveObj.transferEnergy(storageLink.liveObj);
                        }
                    }
                    break;
            }
        } catch (err) {
            //probably controllerLink or storageLink isn't defined
            //do nothing
        }
    }
}

module.exports = Conduit;