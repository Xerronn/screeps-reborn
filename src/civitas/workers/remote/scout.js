const Remotus = require("./remotus");

//creep tasked with scouting around a room for suitable remotes
class Scout extends Remotus {
    constructor(creepId) {
        super(creepId);

        //populate a list of rooms that the scout should visit
        if (!this.memory.targets) {
            let options = Object.values(Game.map.describeExits(this.room));
            let visited = Object.keys(global.Archivist.getRemotes(this.memory.spawnRoom));

            let targets = [];
            for (let t of options) {
                if (!visited.includes(t)) {
                    targets.push(t);
                }
            }
            this.memory.targets = targets;
        }

        this.targetRoom = this.memory.targets[0];

        this.update(true)
    }

    update(force=false) {
        if (this.updateTick != Game.time || force == true) {
            if (!super.update(force)) {
                //creep was killed
                if (this.ticksToLive > 2) {
                    //log that room is dangerous
                    data = {
                        status : "dangerous"
                    }
                    global.Archivist.logRemote(this.memory.spawnRoom, this.targetRoom, data);
                }
                return false;
            }
            //attributes that will change tick to tick
        }
        return true;
    }

    run() {
        //move to current targetRoom
        if (!this.arrived) {
            this.march();
        } else if (this.room == this.memory.spawnRoom) {
            //ensures that it travels back through the home room, just to be safe
            if (this.memory.targets.length > 0) {
                this.targetRoom = this.memory.targets[0];
                this.arrived = false;
                this.march();
            } else {
                //signal that we are ready to start building up to the remotes
                global.Archivist.setDoneScouting(this.room, true);
                //scouting is done, no need to have rebirth
                delete this.memory.generation;
            }
        } else {
            //once we are there, we can do some logging
            let sources = Game.rooms[this.targetRoom].find(FIND_SOURCES);
            if (sources.length == 2 && Game.rooms[this.targetRoom].controller && !Game.rooms[this.targetRoom].controller.owner) {
                let data = {
                    status : "safe",
                    distances : []
                };
                for (let source of sources) {
                    data.distances.push(this.pos.findPathTo(source).length);
                }
                global.Archivist.logRemote(this.memory.spawnRoom, this.targetRoom, data);
            } else if (Game.rooms[this.targetRoom].controller.owner) {
                //log that the room is occupied
                let data = {
                    status : "claimed"
                };
                global.Archivist.logRemote(this.memory.spawnRoom, this.targetRoom, data);
            }

            //then move to next room
            this.memory.targets.shift();
            this.arrived = false;
            this.targetRoom = this.memory.spawnRoom;
            this.march();
        }
    }
}

module.exports = Scout;