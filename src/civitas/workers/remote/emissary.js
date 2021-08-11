const Remotus = require("./remotus");

//creep tasked with either claiming or reserving a controller
//creep must be passed the task in memory when spawned
class Emissary extends Remotus {
    constructor(creepId) {
        super(creepId);
        
        this.memory.spawnTime = Game.time;

        this.update(true);
    }

    run() {
        //march to room and flee if enemies
        if (super.run()) return;

        if (this.memory.task == "reserve") {
            this.reserve();
        } else if (this.memory.task == "claim") {
            this.claim();
        }

        //make sure to spawn new emissary before the current one dies, to maintain 100% uptime
        let travelTime = this.memory.travelTime + this.body.length * 3
        if (this.memory.generation !== undefined && this.memory.travelTime && this.ticksToLive <= travelTime) {
            //basically rebirth but without the dying first

            let task = `
                global.Imperator.administrators[\"` + this.memory.spawnRoom + `\"].supervisor.initiate({
                    'body': objArr[0],
                    'type': objArr[1],
                    'memory': objArr[2]
                });
            `

            let reservedTicks = Game.rooms[this.room].controller.reservation.ticksToEnd;
            global.TaskMaster.schedule(Game.time + reservedTicks - (travelTime * 2), task, [[...this.body], this.memory.type, {...this.memory}]);
            //no more rebirth for you
            delete this.memory.generation;
        }
    }

    /**
     * Method that travels to the room controller and reserves it
     */
    reserve() {
        let controller = Game.rooms[this.room].controller;
        if (this.pos.inRangeTo(controller, 1)) {
            if (!this.memory.travelTime) {
                this.memory.travelTime = Game.time - this.memory.spawnTime;
            }
            this.liveObj.reserveController(controller);
        } else {
            this.liveObj.moveTo(controller);
        }
    }

    /**
     * Method that travels to the room controller and claims it
     */
    claim() {
        let controller = Game.rooms[this.room].controller;
        if (this.pos.inRangeTo(controller, 1)) {
            this.liveObj.claimController(controller);
        } else {
            this.liveObj.moveTo(controller);
        }
    }
}

module.exports = Emissary;