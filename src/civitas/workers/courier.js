const Civitas = require("../civitas");

//creep tasked with transporting energy from miners to storage
class Courier extends Civitas {
    constructor(creepId) {
        super(creepId);

        //! TODO: what if the storage is killed
        this.storageId = Game.rooms[this.room].storage.id;
        if (Game.rooms[this.room].terminal) {
            this.terminalId = Game.rooms[this.room].terminal.id;
        }
        this.evolved = false;

        this.update(true);
    }

    /**
     * Update live game object references each tick
     */
    update(force) {
        if (this.updateTick != Game.time || force == true) {
            if (!super.update(force)) {
                //creep is dead
                return false;
            }
            //attributes that will change tick to tick
            this.storage = Game.getObjectById(this.storageId);
            this.container = Game.getObjectById(this.memory.container);
            if (this.terminalId) {
                this.terminal = Game.getObjectById(this.terminalId);
            }

            //cached path for movement defined after we have a container to path to
            if (!this.path && this.container) {
                this.path = PathFinder.search(
                    this.storage.pos, 
                    {
                        "pos" : this.container.pos,
                        "range" : 1
                    },
                    {
                        "roomCallback": global.Illustrator.getCostMatrix,
                        "plainCost": 2,
                        "swampCost": 10
                    }
                ).path;

                this.reversedPath = [...this.path].reverse();
            }
        }
        return true;
    }

    /**
     * logic to run each tick
     */
    run() {
        //if container no longer exists, its been replaced by a link
        if (!this.container) {
            //disable rebirth
            delete this.memory.generation;
            //rip
            this.liveObj.suicide();
            return;
        }
        
        //evolve if the container ever gets full. it means the transporter is underpowered
        if (this.container.store.getFreeCapacity() == 0 && this.evolved == false) {
            this.evolve();
        }

        if (this.store.getUsedCapacity() == 0 || (this.memory.task == "withdraw" && this.store.getFreeCapacity() > 0)) {
            this.memory.task = "withdraw";
            this.moveByPath();
            this.withdrawContainer(this.memory.resource);
        } else {
            this.memory.task = "deposit";
            this.moveByPath(true);
            this.depositStorage(this.memory.resource);
        }
    }

    /**
     * Method to travel along the cached path
     * @param {Boolean} reversed go in the opposite direction
     * @param {Boolean} reset reset the path to the start
     */
     moveByPath(reversed) {
        //detect if creep is stuck, and path normally if necessary
        if (this.stuckPos.x != this.pos.x || this.stuckPos.y != this.pos.y) {
            this.stuckPos = this.pos;
            this.stuckTick = 0;
        } else {
            this.stuckPos = this.pos;
            this.stuckTick++;
        }

        if (this.stuckTick > 3) {
            //do something
            this.pathing = false;
        }
        if (!reversed) {
            this.liveObj.moveByPath(this.path);
        } else {
            this.liveObj.moveByPath(this.reversedPath);
        }
    }

    /**
     * Move to assigned container and withdraw if the container can fill the creep
     */
    withdrawContainer(resourceType=RESOURCE_ENERGY) {
        if (this.pos.inRangeTo(this.container, 1)) {
            if (this.container.store.getUsedCapacity(resourceType) > this.store.getFreeCapacity(resourceType)) {
                this.liveObj.withdraw(this.container, resourceType);
            }
        } else {
            if (!this.pathing) {
                this.liveObj.moveTo(this.container);
            }
        }
    }

    /**
     * Move to storage and deposit all stored energy
     */
    depositStorage(resourceType=RESOURCE_ENERGY) {
        if (this.pos.inRangeTo(this.storage, 1)) {
            this.liveObj.transfer(this.storage, resourceType);
        } else if (!this.pathing) {
            this.liveObj.moveTo(this.storage);
        }
    }

    depositTerminal() {
        if (this.pos.inRangeTo(this.terminal, 1)) {
            this.liveObj.transfer(this.terminal, resourceType);
        } else if (!this.pathing) {
            this.liveObj.moveTo(this.terminal);
        }
    }

    /**
     * Method to evolve creep if its base body isn't enough to keep up
     */
    evolve() {
        //add one of each
        //only if < 800 in case it fills up while transporter is dead
        if (this.ticksToLive < 800) {
            //miners mine 12 energy per tick, and you have to travel both ways
            let travelLength = this.storage.pos.findPathTo(this.container).length * 12 * 2;
            let carryCount = Math.ceil(travelLength / 50);

            let newBody = [];
            for (let i = 0; i < carryCount; i++) {
                newBody.push(MOVE);
                newBody.unshift(CARRY);
            }
            this.evolved = true;
            this.memory.body = newBody;
        }
    }
}

module.exports = Courier;