const Castrum = require("./castrum");

//wrapper class for link object
class Conduit extends Castrum {
    constructor(linkId) {
        super(linkId);

        //if the controller link needs energy
        this.needsFilling = false;

        //check if the link is within 2 squares of either a controller or storage
        let nearestBuilding = this.pos.findClosestByRange(FIND_STRUCTURES, {
            filter: (structure) => {
                return structure.structureType != STRUCTURE_LINK
                    && [STRUCTURE_STORAGE, STRUCTURE_CONTROLLER].includes(structure.structureType)
                    && this.pos.inRangeTo(structure, 2)
            }
        });

        //if it isn't it is a fill type link(does nothing but receive)
        if (nearestBuilding) {
            let sType = nearestBuilding.structureType;
            this.type = sType;

            //set supervisor link references for roles
            if (sType == STRUCTURE_STORAGE) {
                this.getSupervisor().storageLink = this;
            } else {
                this.getSupervisor().controllerLink = this;
            }
        } else {
            this.type = "fill";
            
            //assign this link to the source if it is near one
            let nearSource = this.pos.findInRange(FIND_SOURCES, 3)[0]
            if (nearSource) {
                //set the link attribute on the source
                let allSources = global.Archivist.getSources(this.room);

                allSources[nearSource.id].link = this.id;
            }
        }
    }

    /**
     * link logic run each tick
     */
    run() {
        let controllerLink = this.getSupervisor().controllerLink;
        let storageLink = this.getSupervisor().storageLink;
        try {
            switch (this.type) {
                case STRUCTURE_STORAGE:
                    //if it is full, send the energy, if it is not, request to be filled to max
                    if (this.store.getUsedCapacity(RESOURCE_ENERGY) == this.store.getCapacity(RESOURCE_ENERGY)) {
                        this.needsFilling = false;
                        if (controllerLink && controllerLink.store.getUsedCapacity(RESOURCE_ENERGY) < 650) {
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
                case STRUCTURE_CONTROLLER:
                    if (this.store.getUsedCapacity(RESOURCE_ENERGY) <= 400 && storageLink) {
                        storageLink.needsFilling = true;
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