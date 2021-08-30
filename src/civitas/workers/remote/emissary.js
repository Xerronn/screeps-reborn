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
        } else if (this.memory.task == "doneClaiming") {
            global.Imperator.initRoom(this.targetRoom, this.memory.spawnRoom);
            this.liveObj.suicide();
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

            let reservedTicks = 100;
            if (Game.rooms[this.targetRoom]) {
                reservedTicks = Game.rooms[this.targetRoom].controller.reservation.ticksToEnd;
            }
            global.TaskMaster.schedule(this.memory.spawnRoom, Game.time + reservedTicks - (travelTime * 2), task, [[...this.body], this.memory.type, {...this.memory}]);
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
            this.sign();
            //disable rebirth because this creep will never need to come back
            delete this.memory.generation;
            this.memory.task = 'doneClaiming';
        } else {
            this.liveObj.moveTo(controller);
        }
    }

    /**
     * Method to sign the controller with a latin saying
     */
    sign() {
        let choices = [
            "Omnium Rerum Principia Parva Sunt",                            //The beginnings of all things are small.
            "Pecunia Nervus Belli",                                         //Money is the soul (or sinew) of war
            "Male Parta Male Dilabuntur",                                   //What has been wrongly gained is wrongly lost
            "Aere Perennius",                                               //More lasting than bronze
            "Nil Desperandum",                                              //Never despair!
            "Timendi Causa Est Nescire",                                    //The cause of fear is ignorance
            "Per Aspera Ad Astra",                                          //Through hardship to the stars
            "Vitam Impendere Vero",                                         //Dedicate your life to truth
            "Ars Longa, Vita Brevis",                                       //Art is long, life is short
            "Alea Jacta Est",                                               //The die is cast
            "Festina lente",                                                //Make haste slowly
            "Una salus victis nullam sperare salutem",                      //The one well being of the defeated is to not hope for well being
            "Optimum est pati quod emendare non possis",                    //It is best to endure what you cannot change
            "Quod scripsi, scripsi",                                        //What I have written, I have written
            "Quemadmoeum gladis nemeinum occidit, occidentis telum est",    //a sword is never a killer, it is a tool in a killer's hand
            "Flamma fumo est proxima",                                      //Where there is smoke, there is fire
            "Multi famam, conscientiam pauci verentur"                      //Many fear their reputation, few their conscience
        ]

        let controller = Game.rooms[this.room].controller;
        if (this.pos.inRangeTo(controller, 1)) {
            //selected a random message from the message array then sign it with that message
            let selectedMessage = choices[Math.floor(Math.random() * choices.length)];
            this.liveObj.signController(controller, selectedMessage);
        } else {
            this.moveTo(controller);
        }
    }
}

module.exports = Emissary;