const GameObj = require("../gameObj");

//the parent creep definition
class Civitas extends GameObj {
    constructor(creepId) {
        super(creepId);

        //attributes that will not change tick to tick
        if (!this.liveObj.memory.type) {
            //this should never happen
            this.type = "civitates";
        } else {
            this.type = this.liveObj.memory.type;
        }
        this.name = this.liveObj.name;
        //! TODO: need to account for damaged body somehow
        this.body = this.liveObj.body.map(b => b.type);
        
        this.update(true);
    }

    update(force=false) {
        if (this.updateTick != Game.time || force == true) {
            //stop if you're dead
            if (!super.update(force)) {
                //only rebirth if the generation flag is there. If you want a creep to rebirth, set generation = 0 in the memory
                if (this.memory.generation !== undefined) {
                    let template = {
                        "body": [...this.body],
                        "type": this.memory.type,
                        "memory": {...this.memory}
                    };
                    this.getSupervisor().initiate(template);
                }
                //delete this wrapper
                this.getSupervisor().dismiss(this);
                return false;
            }
            this.store = this.liveObj.store;
            this.fatigue = this.liveObj.fatigue;
            this.memory = this.liveObj.memory;
            this.ticksToLive = this.liveObj.ticksToLive;
        }
        return true;
    }

    /**
     * Method to automatically move a creep off the edge in the correct direction
     * @returns Boolean on if the creep is on an edge tile and moving
     */
    moveEdge() {
        switch(this.pos.x) {
			case 0: 
				this.liveObj.move(RIGHT);
				return true;
			case 49: 
				this.liveObj.move(LEFT);
				return true;
		}
		switch(this.pos.y) {
			case 0:
				this.liveObj.move(BOTTOM);
				return true;
			case 49: 
				this.liveObj.move(TOP);
				return true;
		}

        return false;
    }

    /**
     * Method to boost the creep with a already prepared lab
     * @param {String} boostType 
     */
    boost(boostType) {
        let workshop = this.getSupervisor().boostingWorkshops[boostType];

        if (this.pos.findRangeTo(workshop.liveObj, 1)) {
            let result = workshop.liveObj.boostCreep(this.liveObj);
            if (result == OK) {
                workshop.boosting = false;
                this.getSupervisor().boostingWorkshops[boostType] = undefined;
                return false;
            }
        } else {
            this.liveObj.moveTo(workshop.liveObj);
        }
        return true;
    }

    /**
     * Method to get the creep's supervisor
     * @returns Supervisor
     */
     getSupervisor() {
        return global.Imperator.administrators[this.memory.spawnRoom].supervisor;
    }

    /**
     * Method to get the creep's executive
     * @returns Executive
     */
     getExecutive() {
        return global.Imperator.administrators[this.memory.spawnRoom].executive;
    }
}

module.exports = Civitas;