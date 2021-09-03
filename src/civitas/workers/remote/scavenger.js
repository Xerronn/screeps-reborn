const Remotus = require("./remotus");

//remote creep that goes to a room and scavenges resources
class Scavenger extends Remotus {
    constructor(creepId) {
        super(creepId);
    }

    run() {
        if (this.store.getFreeCapacity() > 0) {
            if (this.room !== this.memory.targetRoom) {
                this.liveObj.travelTo(new RoomPosition(25,25, this.targetRoom), {preferHighway:true});
                return;
            }
            let resources = Game.rooms[this.room].find(FIND_DROPPED_RESOURCES);

            for (let res of resources) {
                if (res.resourceType == RESOURCE_MIST) {
                    if (this.pos.inRangeTo(res, 1)) {
                        this.liveObj.pickup(res);
                    } else {
                        this.liveObj.travelTo(res);
                    }
                    return;
                }
            }
            //when there is no more mist
            delete this.memory.generation;
        } else {
            if (this.room !== this.memory.spawnRoom) {
                this.liveObj.travelTo(new RoomPosition(25,25, this.memory.spawnRoom), {preferHighway:true});
                return;
            }
            let terminal = Game.rooms[this.memory.spawnRoom].terminal;
            if (this.pos.inRangeTo(terminal, 1)) {
                this.liveObj.transfer(terminal, RESOURCE_MIST);
            } else {
                this.liveObj.travelTo(terminal);
            }
            return;
            
        }
    }
}

module.exports = Scavenger;