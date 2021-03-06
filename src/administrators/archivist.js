//Entity for managing memory
class Archivist {
    constructor() {
    }

    /**
     * Function that builds the memory object at the beginning and after global resets
     * @param {boolean} reset reset the memory
     */
    build(reset = false) {
        if (!Memory.creeps || reset) {
            Memory.creeps = {};
        }

        if (!Memory.rooms || reset) {
            Memory.rooms = {};
        }

        if (!Memory.gFlags || reset) {
            Memory.gFlags = {};
            Memory.gFlags.memoryInit = false;
        }

        for (var room of global.Imperator.dominion) {
            if (!Memory.rooms[room]) {
                Memory.rooms[room] = {};
                Memory.rooms[room].flags = {}
                Memory.rooms[room].flags.gameStage = 0;
            
                //first chunk of code from the old source material
                //get all sources and init a list to track workers
                Memory.rooms[room].sources = {};
                let sources = Game.rooms[room].find(FIND_SOURCES).map(source => source.id);
                for (let source of sources) {
                    Memory.rooms[room].sources[source] = {};
                    Memory.rooms[room].sources[source].workers = {};
                }
            }
        }

        //This must be at the end of this method
        //it should only ever happen once, on the first build of the archivist
        //it will auto renew as per defined in the refresh method using the taskMaster
        if (!Memory.gFlags.memoryInit) {
            this.refresh();
            Memory.gFlags.memoryInit = true;
        }
    }

    /**
     * Refresh all structures cache
     */
    refresh(onlyOnce=false) {
        for (let room of global.Imperator.dominion) {
            if (!Game.rooms[room] || !Game.rooms[room].controller.my) continue;
            Memory.rooms[room].structures = {};
            let sortedStructures = {};
            let allStructures = Game.rooms[room].find(FIND_STRUCTURES);

            //sort all the structures into an object so we can easily add them to memory
            //eliminates filtering the structures for each type
            for (let struc of allStructures) {
                if (!(struc.structureType in sortedStructures)) {
                    sortedStructures[struc.structureType] = [];
                }
                sortedStructures[struc.structureType].push(struc);
            }
 
            //all structures
            for (let strucType in sortedStructures) {
                //create the empty memory
                eval("Memory.rooms[room].structures." + strucType + "s = []");

                //add all the structure id's to memory
                let call = "sortedStructures[\"" + strucType + "\"].forEach(obj => Memory.rooms[room].structures." + strucType + "s.push(obj.id))";
                eval(call);
            }
        }

        //skip the scheduler if we only want it once
        if (onlyOnce) return;

        //do it again in 100 ticks
        //! make sure this gets executed only once. Use gflags
        let task = "global.Archivist.refresh()";
        global.TaskMaster.schedule('global', Game.time + 100, task);
    }

    /**
     * Method that logs some information about a scouted remote to memory
     * @param {String} ownerRoom string representing the room that owns the remote
     * @param {String} remoteRoom string representing the remote
     * @param {Object} data data to store in the memory
     */
    logRemote(ownerRoom, remoteRoom, data) {
        if (!Memory.rooms[ownerRoom].remotes) {
            Memory.rooms[ownerRoom].remotes = {};
        }
        Memory.rooms[ownerRoom].remotes[remoteRoom] = data;
    }

    /////////////////
    /////GETTERS/////
    /////////////////

    /**
     * Get the anchor point of a room
     * @param {String} room string representation of a room 
     * @returns the anchor coordinate object
     */
    getAnchor(room) {
        return Memory.rooms[room].flags.anchor;
    }

    /**
     * Gets the labs that are boosting and what chemicals they have
     * @returns 
     */
    getBoostingWorkshops(room) {
        return Memory.rooms[room].flags.boostingWorkshops || {};
    }

    /**
     * Get the curator spawned flag for a given room
     * @param {String} room string representation of a room
     * @returns the curator spawned flag
     */
    getCuratorSpawned(room) {
        return Memory.rooms[room].flags.curatorSpawned;
    }

    /**
     * Get the done scouting flag for a given room
     * @param {String} room string representation of a room 
     * @returns the done Scouting flag
     */
    getDoneScouting(room) {
        return Memory.rooms[room].flags.doneScouting;
    }

    /**
     * Get extensions filled flag for a given room
     * @param {String} room string representing the room
     * @returns value of the extensionsfilled flag
     */
    getExtensionsFilled(room) {
        return Memory.rooms[room].flags.extensionsFilled;
    }

    /**
     * Get gameStage flag for a given room
     * @param {String} room string representing the room
     * @returns value of the gameStage flag
     */
     getGameStage(room) {
        return Memory.rooms[room].flags.gameStage;
    }

    /**
     * Get the garrison spawned flag for a given room
     * @param {String} room string representation of a room
     * @returns the garrison spawned flag
     */
     getGarrisonSpawned(room) {
        return Memory.rooms[room].flags.garrisonSpawned;
    }

    /**
     * Get labs filled flag for a given room
     * @param {String} room string representing the room 
     * @returns value of the labsFilled flag
     */
    getLabsFilled(room) {
        return Memory.rooms[room].flags.labsFilled;
    }

    /**
     * Get num contractors flag for a given room
     * @param {String} room string representing the room 
     * @returns value of the numContractors flag
     */
    getNumContractors(room) {
        return Memory.rooms[room].flags.numContractors;
    }

    /**
     * Get all data on remotes for a room
     * @param {String} room string representing the room
     * @returns remotes object
     */
    getRemotes(room) {
        return Memory.rooms[room].remotes || {};
    }

    /**
     * Get remotes built flag for a given room
     * @param {String} room string representing the room
     * @returns value of Remotes built flag
     */
     getRemoteBuilt(room) {
        return Memory.rooms[room].flags.remoteBuilt;
    }

    /**
     * Get roads built flag for a given room
     * @param {String} room string representing the room
     * @returns value of roadsBuilt flag
     */
    getRoadsBuilt(room) {
        return Memory.rooms[room].flags.roadsBuilt;
    }

    /**
     * Get all sources in a room
     * @param {String} room string representing the room
     * @returns  room sources object
     */
    getSources(room) {
        return Memory.rooms[room].sources;
    }

    /**
     * Get a room statistic
     * @param {String} room string representing the room
     * @param {String} stat the statistic to return
     * @returns  room sources object
     */
    getStatistic(room, stat) {
        try {
            return Memory.rooms[room].statistics[stat];
        } catch (err) {
            return 0;
        }
    }

    /**
     * Get all instances of a certain structure within a room
     * @param {String} room string representing the room
     * @param {String} structure screeps constant type of structure to get
     * @returns an array of live game objects
     */
    getStructures(room, structure) {
        let structureString = structure + "s";
        let call = "Memory.rooms[\"" + room + "\"].structures." + structureString + ".map(obj => Game.getObjectById(obj))";
        try {
            return eval(call);
        } catch (err) {
            return [];
        } 
    }

    /**
     * Get towers filled flag for a given room
     * @param {String} room string representing the room 
     * @returns value of the towersFilled flag
     */
     getTowersFilled(room) {
        return Memory.rooms[room].flags.towersFilled;
    }

    /////////////////
    /////SETTERS/////
    /////////////////

    /**
     * Set the anchor point of a room
     * @param {String} room string representation of a room 
     * @param {Object} value object with x and y coordinates
     */
    setAnchor(room, value) {
        Memory.rooms[room].flags.anchor = value;
    }

    /**
     * Sets the labs that are boosting and what chemicals they have
     * @returns 
     */
    setBoostingWorkshops(room, value) {
        Memory.rooms[room].flags.boostingWorkshops = value;
    }

    /**
     * Set the curator spawned flag for a given room
     * @param {String} room string representation of a room
     * @param {Boolean} value true or false value to set the flag
     * 
     */
     setCuratorSpawned(room, value) {
        Memory.rooms[room].flags.curatorSpawned = value;
    }
    
    /**
     * Set the done scouting of a room
     * @param {String} room string representation of a room 
     * @param {Boolean} value true or false value to set the flag
     */
     setDoneScouting(room, value) {
        Memory.rooms[room].flags.doneScouting = value;
    }

    /**
     * Set extensions filled flag for a given room
     * @param {String} room string representing the room
     * @param {Boolean} value true or false value to set the flag
     */
    setExtensionsFilled(room, value) {
        Memory.rooms[room].flags.extensionsFilled = value;
    }

    /**
     * Set the room planning gameStage for a given room
     * @param {String} room string representing the room
     * @param {String} value value to set the flag
     */
    setGameStage(room, value) {
        Memory.rooms[room].flags.gameStage = value;
    }

    /**
     * Set the garrison spawned flag for a given room
     * @param {String} room string representation of a room
     * @param {Boolean} value true or false value to set the flag
     * 
     */
     setGarrisonSpawned(room, value) {
        Memory.rooms[room].flags.garrisonSpawned = value;
    }

    /**
     * Set labs filled flag for a given room
     * @param {String} room string representing the room 
     * @param {Boolean} value true or false value to set the flag
     */
     setLabsFilled(room, value) {
        Memory.rooms[room].flags.labsFilled = value;
    }

    /**
     * Set num contractors flag for a given room
     * @param {String} room string representing the room
     * @param {Integer} value integer to set the flag to
     */
    setNumContractors(room, value) {
        Memory.rooms[room].flags.numContractors = value;
    }

    /**
     * Set remote built flag for a given room
     * @param {String} room string representing the room
     * @param {Boolean} value boolean to set the flag to
     */
     setRemoteBuilt(room, value) {
        Memory.rooms[room].flags.remoteBuilt = value;
    }

    /**
     * Set roads built flag for a given room
     * @param {String} room string representing the room
     * @param {Boolean} value boolean to set the flag to
     */
    setRoadsBuilt(room, value) {
        Memory.rooms[room].flags.roadsBuilt = value;
    }

    /**
     * Set a room statistic
     * @param {String} room string representing the room
     * @param {String} stat the statistic to return
     * @returns  room sources object
     */
    setStatistic(room, stat, value) {
        if (!Memory.rooms[room].statistics) {
        Memory.rooms[room].statistics = {};
        }
        Memory.rooms[room].statistics[stat] = value;
    }

    /**
     * Set towers filled flag for a given room
     * @param {String} room string representing the room 
     * @param {Boolean} value true or false value to set the flag
     */
    setTowersFilled(room, value) {
        Memory.rooms[room].flags.towersFilled = value;
    }
}

module.exports = Archivist;