//entity for room planning
class Architect {
    constructor() {
    }

    /**
     * Function to do room planning whenever gamestage changes
     * @param {String} room string representation of a room 
     */
    design(room, gameStage) {
        switch (gameStage) {
            case "1":
                //calculate anchor and build spawn
                this.buildBunker(room);
                //start the room off with the five basic engineers
                global.Imperator.administrators[room].executive.phaseOne();
                break;
            case "2":
            case "3":
                //turning rcl 2 and 3
                //build the first few extensions
                this.buildBunker(room);
                break;
            case "3.1":
                //towers are built, so build containers at sources
                this.buildSourceContainers(room);
                break;
            case "4":
                //just turned rcl 4
                this.buildBunker(room);
                break;
            case "4.1":
                //storage is built, time to switch to phase two
                global.Imperator.administrators[room].executive.phaseTwo();
                break;
            case "4.2":
                //storage has 100k energy, build bunker roads
                this.buildBunkerRoads(room);
                break;
            case "4.3":
                //bunker roads are done, build roads to sources
                this.buildUtilityRoads(room);
                global.Archivist.setRoadsBuilt(room, true);
                break;
            case "5":
                //just turned rcl 5
                //build upgrader link
                this.buildBunker(room);
                this.buildControllerLink(room);
                global.Imperator.administrators[room].executive.spawnArbiter();
                break;
            case "6":
                //just turned rcl 6
                //build lots of expensive stuff
                this.buildBunker(room);
                break;
            case "6.1":
                //build first source link
                this.buildSourceLinks(room);
                break;
            case "6.2":
                //build extractor and road to mineral
                this.buildExtractor(room);
                break;
            case "6.3":
                //start scouting for remotes
                global.Imperator.administrators[room].executive.spawnScout();
                break;
            case "6.4":
                //start reserving and build roads to remote
                this.buildRemote(room);
                break;
            case "7":
                //just turned rcl 7
                //build second source link
                this.buildBunker(room);
                this.buildSourceLinks(room);
                break;
            case "7.1":
                //everything is done building and storage has > 100,000 energy
                //TODO: start remote mining
                break;
            case "8":
                //TODO: lots and lots
                this.buildBunker();
                break;    
        }
    }

    /**
     * 
     * @param {String} room string representing a room
     * @param {Boolean} dry whether to actually set the anchor or just calculate it
     * @returns 
     */
    calculateAnchor(room, dry=false) {
        let bunkerSchema = global.Illustrator.getBunkerSchema();

        if (!dry) {
            //clear out any buildings left by enemies
            let enemyBuildings = Game.rooms[room].find(FIND_STRUCTURES, {
                filter: (structure) => {return structure.my == false && struc.structureType != STRUCTURE_STORAGE && struc.structureType != STRUCTURE_TERMINAL}});
            for (var struct of enemyBuildings) {
                struct.destroy();
            }
        }

        //if this is the first room and you have to manually place your spawn, it will calculate the anchor off that placement
        //TODO: figure out a way to avoid user error in spawn placement. possible switch around spawn positions
        let spawns = Game.rooms[room].find(FIND_MY_SPAWNS);
        if (spawns.length > 0) {
            let spawnPos = {
                "x": spawns[0].pos.x - bunkerSchema["spawn"]["pos"][0].x,
                "y": spawns[0].pos.y - bunkerSchema["spawn"]["pos"][0].y
            }
            if (!dry) {
                global.Archivist.setAnchor(room, spawnPos)
            }
            return JSON.stringify(spawnPos);
        } else {
            //find positions the bunker could fit
            var candidates = [];
            for (var x = 2; x < 38; x++) {
                for (var y = 2; y < 38; y++) {
                    let dq = false;
                    let wallCounter = 0;
                    for (var candidate of Game.rooms[room].lookAtArea(y, x, y + 10, x + 10, true)) {
                        if (candidate["terrain"] == "wall") {
                            //if it is an edge, give some slack
                            if (candidate.x == x || candidate.x == x+10 || candidate.y == y || candidate.y == y+10) {
                                wallCounter++;
                                if (wallCounter > 5) {
                                    dq = true;
                                    break;
                                }
                            } else {
                                dq = true;
                                break; //break as soon as it is dq
                            }
                        }
                    }
                    if (!dq) {
                        //if the position does not contain a wall, push it to possibles
                        candidates.push({
                            "x": x,
                            "y": y,
                            "walls": wallCounter
                        });
                    } 
                }
            }
            //find all the things we want to be close to
            var POVs = [];
            var sources = Game.rooms[room].find(FIND_SOURCES);
            for (var source of sources) {
                POVs.push(source.pos);
            }
            POVs.push(Game.rooms[room].controller.pos);

            //centroid calculation
            var centroid = {
                "x": 0,
                "y": 0
            };
            for (var pov of POVs) {
                centroid["x"] += pov.x;
                centroid["y"] += pov.y;
            }
            centroid["x"] = Math.floor(centroid["x"] / POVs.length);
            centroid["y"] = Math.floor(centroid["y"] / POVs.length);
            var centroidPos = new RoomPosition(centroid["x"], centroid["y"], room);

            var bestCandidate = {"score": 100};
            for (var candidate of candidates) {
                var position = new RoomPosition(candidate["x"] + 5, candidate["y"] + 5, room);
                
                //score is a function of how many walls are in the edges and distance to the centroid
                var candidateScore = position.findPathTo(centroidPos).length + Math.pow(1.75, candidate["walls"]);
                if (bestCandidate["score"] > candidateScore) {
                    bestCandidate["score"] = candidateScore;
                    bestCandidate["x"] = candidate["x"];
                    bestCandidate["y"] = candidate["y"];
                }
            }

            //set the anchor to the best candidate
            if (!dry) {
                global.Archivist.setAnchor(room, bestCandidate)
            }
            return JSON.stringify(bestCandidate);
        }
    }

    /**
     * Method that builds all newly unlocked bunker structures
     */
     buildBunker(room) {
        let bunkerSchema = global.Illustrator.getBunkerSchema();

        //get anchor, if there isn't one, calculate a new one
        let anchor = global.Archivist.getAnchor(room);
        if (!anchor) {
            anchor = this.calculateAnchor(room);
        }

        var roomAnchor = new RoomPosition(anchor["x"], anchor["y"], room);
        var typesToBuild = [STRUCTURE_SPAWN, STRUCTURE_EXTENSION, STRUCTURE_TOWER, STRUCTURE_LAB, STRUCTURE_STORAGE, STRUCTURE_LINK, STRUCTURE_FACTORY, STRUCTURE_POWER_SPAWN, STRUCTURE_NUKER, STRUCTURE_OBSERVER, STRUCTURE_TERMINAL];

        //hande reliable first spawn building
        if (Game.rooms[room].find(FIND_MY_SPAWNS).length < 1) {
            for (var i =0; i < 10; i++) { 
                let success = Game.rooms[room].createConstructionSite(
                    roomAnchor.x + bunkerSchema["spawn"]["pos"][0].x, roomAnchor.y + bunkerSchema["spawn"]["pos"][0].y, STRUCTURE_SPAWN);
                
                if (success == 0) {
                    break;
                }
            }
        }
        //TODO: build ramparts surrounding our miner boiis
        //builds the appropriate number of each structure type
        for (var type of typesToBuild) {
            this.buildNewStructures(type, room);
        }
    }

    /**
     * function to build new structures
     * @param {String} structureConstant structure type constant
     * @param {String} room string representing room
     */
    buildNewStructures(structureConstant, room) {
        let bunkerSchema = global.Illustrator.getBunkerSchema();
        let roomAnchor = global.Archivist.getAnchor(room);
        //find how many exist
        let numExist = Game.rooms[room].find(FIND_STRUCTURES, {
            filter: (structure) => {return structure.structureType == structureConstant}}).length;

        //find how many are building
        let numBuilding = Game.rooms[room].find(FIND_MY_CONSTRUCTION_SITES, {
            filter: (structure) => {return structure.structureType == structureConstant}}).length;

        //find how many are possible to build at the current level
        let maxToBuild = CONTROLLER_STRUCTURES[structureConstant][Game.rooms[room].controller.level];
        if (maxToBuild > bunkerSchema[structureConstant]["pos"].length) maxToBuild = bunkerSchema[structureConstant]["pos"].length;

        //calculate the number to build
        let numToBuild = maxToBuild - (numExist + numBuilding);
        
        if (numExist + numBuilding < maxToBuild) {
            //build the structure
            let index = numExist + numBuilding;
            for (let i = 0; i < numToBuild; i++) {
                let pos = bunkerSchema[structureConstant]["pos"][index + i];
                Game.rooms[room].createConstructionSite(new RoomPosition(roomAnchor.x + pos["x"], roomAnchor.y + pos["y"], room), structureConstant);
            }
        }
    }

    /**
     * Method to build source containers
     * @param {String} room string representing the room 
     */
    buildSourceContainers(room) {
        //get anchor
        let anchor = global.Archivist.getAnchor(room);
        var roomAnchor = new RoomPosition(anchor["x"], anchor["y"], room);
        
        //build paths from the roomAchor to the sources then build containers at the final step in that path
        let closest = []
        for (var source of Game.rooms[room].find(FIND_SOURCES)) {
            let pathToSource = roomAnchor.findPathTo(source.pos, {range: 1, ignoreCreeps: true})
            let closestPosition = new RoomPosition(pathToSource[pathToSource.length - 1]["x"], pathToSource[pathToSource.length - 1]["y"], room);
            closest.push(closestPosition); 
        }
        for (var close of closest) {
            close.createConstructionSite(STRUCTURE_CONTAINER);
        }
    }

    /**
     * Method that builds roads within the bunker
     * @param {String} room string representing the room 
     */
    buildBunkerRoads(room) {
        //get bunker schematics
        let bunkerSchema = global.Illustrator.getBunkerSchema();
        //get anchor
        let anchor = global.Archivist.getAnchor(room);
        var roomAnchor = new RoomPosition(anchor["x"], anchor["y"], room);

        for (var pos of bunkerSchema["road"]["pos"]) {
            //do not build tunnels
            if (Game.rooms[room].lookAt(roomAnchor.x + pos["x"], roomAnchor.y + pos["y"], LOOK_TERRAIN)["terrain"] != "wall") {
                Game.rooms[room].createConstructionSite(new RoomPosition(roomAnchor.x + pos["x"], roomAnchor.y + pos["y"], room), STRUCTURE_ROAD);
                
            }
        }
    }

    /**
     * Method that builds ramparts surrounding the bunker
     * @param {String} room String representing the room 
     */
    buildBunkerRamparts(room) {
        //get anchor
        let anchor = global.Archivist.getAnchor(room);
        var roomAnchor = new RoomPosition(anchor["x"], anchor["y"], room);

        var xMax = roomAnchor.x + 11;
        var yMax = roomAnchor.y + 11;
        for (var x = roomAnchor.x - 1; x <= xMax; x++) {
            for (var y = roomAnchor.y - 1; y <= yMax; y++) {
                if (x == roomAnchor.x - 1 || y == roomAnchor.y - 1 || x == xMax || y == yMax) {
                    Game.rooms[room].createConstructionSite(new RoomPosition(x, y, room), STRUCTURE_RAMPART);
                }
            }
        }
    }

    /**
     * Method that builds roads to all sources
     * @param {String} room string representing the room
     */
    buildUtilityRoads(room) {
        //get anchor
        let anchor = global.Archivist.getAnchor(room);
        var roomAnchor = new RoomPosition(anchor["x"], anchor["y"], room);
        let roomController = Game.rooms[room].controller;

        //define corners of the bunker
        let topRight = new RoomPosition(roomAnchor.x + 10, roomAnchor.y, room);
        let topLeft = roomAnchor;
        let bottomLeft = new RoomPosition(roomAnchor.x, roomAnchor.y + 10, room);
        let bottomRight = new RoomPosition(roomAnchor.x + 10, roomAnchor.y + 10, room);

        let topMiddle = new RoomPosition(roomAnchor.x + 5, roomAnchor.y, room);
        let bottomMiddle = new RoomPosition(roomAnchor.x + 5, roomAnchor.y + 10, room);
        let leftMiddle = new RoomPosition(roomAnchor.x, roomAnchor.y + 5, room);
        let rightMiddle = new RoomPosition(roomAnchor.x + 10, roomAnchor.y + 5, room);
        let corners = [topRight, topLeft, bottomLeft, bottomRight, topMiddle, bottomMiddle, leftMiddle, rightMiddle];

        let roadSites = [];

        var travelSources = Game.rooms[room].find(FIND_SOURCES);

        //build roads from the closest corner to the source
        for (var source of travelSources) {
            let selectedCorner = source.pos.findClosestByPath(corners);
            roadSites.push(selectedCorner.findPathTo(source, {range: 1, ignoreCreeps: true}));
        }

        let selectedCorner = roomController.pos.findClosestByPath(corners);
        roadSites.push(selectedCorner.findPathTo(roomController, {range: 1, ignoreCreeps: true}));

        for (var sites of roadSites) {
            for (var site of sites) {
                Game.rooms[room].createConstructionSite(site.x, site.y, STRUCTURE_ROAD);
            }
        }
        
    }

    /**
     * Method to build the controller link
     * @param {String} room string representing the room
     */
    buildControllerLink(room) {
        //get anchor
        let anchor = global.Archivist.getAnchor(room);
        let roomAnchor = new RoomPosition(anchor["x"], anchor["y"], room);
        let roomController = Game.rooms[room].controller;

        //build link
        let pathToController = roomAnchor.findPathTo(roomController.pos, {range: 2, ignoreCreeps: true})
        let closestPosition = new RoomPosition(pathToController[pathToController.length - 1]["x"], pathToController[pathToController.length - 1]["y"], room);
        closestPosition.createConstructionSite(STRUCTURE_LINK);
    }

    /**
     * Method to build the source links
     * @param {String} room string representing the room
     */
    buildSourceLinks(room) {
        //get anchor
        let anchor = global.Archivist.getAnchor(room);
        var roomAnchor = new RoomPosition(anchor["x"], anchor["y"], room);

        //find the sources and sort by distance
        let sources = Game.rooms[room].find(FIND_SOURCES);
        sources = _.sortBy(sources, source => roomAnchor.getRangeTo(source)).reverse();

        //loop through sources
        for (var source of sources) {
            //find nearby container
            let sourceContainer = source.pos.findClosestByRange(FIND_STRUCTURES, {
                filter: (structure) => { return structure.structureType == STRUCTURE_CONTAINER 
                    && source.pos.inRangeTo(structure, 2)
                }
            });

            //if there is no container, there is already a link so move to next source
            if (!sourceContainer) continue;

            //once a source not in the memory is found, route to it and build a link on the last step of the route
            let pathToContainer = roomAnchor.findPathTo(sourceContainer.pos, {range: 1, ignoreCreeps: true})
            let closestPosition = new RoomPosition(pathToContainer[pathToContainer.length - 1]["x"], pathToContainer[pathToContainer.length - 1]["y"], room);

            if (closestPosition.createConstructionSite(STRUCTURE_LINK) == 0) {
                //remove sourceContainer if a link is successfully built
                sourceContainer.destroy();

                //refresh the cache since we destroyed a container
                global.Archivist.refresh(true);
                return; //end the function once we have built a link
            }
        }
    }

    /**
     * Method to build road to the room's mineral and an excavator
     * @param {String} room string representing the room
     */
    buildExtractor(room) {
        //get anchor
        let anchor = global.Archivist.getAnchor(room);
        var roomAnchor = new RoomPosition(anchor["x"], anchor["y"], room);

        //define corners of the bunker
        let topRight = new RoomPosition(roomAnchor.x + 10, roomAnchor.y, room);
        let topLeft = roomAnchor;
        let bottomLeft = new RoomPosition(roomAnchor.x, roomAnchor.y + 10, room);
        let bottomRight = new RoomPosition(roomAnchor.x + 10, roomAnchor.y + 10, room);

        let topMiddle = new RoomPosition(roomAnchor.x + 5, roomAnchor.y, room);
        let bottomMiddle = new RoomPosition(roomAnchor.x + 5, roomAnchor.y + 10, room);
        let leftMiddle = new RoomPosition(roomAnchor.x, roomAnchor.y + 5, room);
        let rightMiddle = new RoomPosition(roomAnchor.x + 10, roomAnchor.y + 5, room);
        let corners = [topRight, topLeft, bottomLeft, bottomRight, topMiddle, bottomMiddle, leftMiddle, rightMiddle];

        var roomMineral = Game.rooms[room].find(FIND_MINERALS)[0];
        
        //build roads from the closest corner to the mineral
        let selectedCorner = roomMineral.pos.findClosestByPath(corners);
        let roadPath = selectedCorner.findPathTo(roomMineral, {range: 1, ignoreCreeps: true});

        for (let pos of roadPath) {
            Game.rooms[room].createConstructionSite(pos.x, pos.y, STRUCTURE_ROAD);
        }

        //build extractor
        roomMineral.pos.createConstructionSite(STRUCTURE_EXTRACTOR);
    }

    /**
     * Method to start spawning emissaries and build roads to the remote
     */
    buildRemote(room) {
        //! todo: what if the sources in the room are unaccessible behind walls
        //this could be tweaked to just remote at all 'safe' rooms

        //first find the room that we want to remote in.
        let selectedRemote = undefined;
        let remotes = global.Archivist.getRemotes(room);

        let viable = [];
        for (let r of Object.keys(remotes)) {
            if (remotes[r].status == "safe") {
                viable.push(r);
            }
        }

        if (viable.length == 0) {
            selectedRemote = undefined;
        } else if (viable.length == 1) {
            selectedRemote = viable[0];
        } else {

            let best = 10000;
            let bestRoom = "none";
            for (let option of viable) {
                let distances = remotes[option].distances;
                let avg = (distances[0] + distances[1]) / 2;
                if (avg < best) {
                    best = avg;
                    bestRoom = option;
                }
            }

            selectedRemote = bestRoom;
        }

        remotes[selectedRemote].selected = true;

        //now we need to spawn the reserver with that room as a target
        //! global.Imperator.administrators[room].executive.spawnEmissary(selectedRemote);

        //now lets build a road to that exit
        let storage = Game.rooms[room].storage;
        let roadPath = storage.pos.findPathTo(new RoomPosition(10, 10, selectedRemote), {range: 1, ignoreCreeps: true});

        for (let pos of roadPath) {
            //! Game.rooms[room].createConstructionSite(pos.x, pos.y, STRUCTURE_ROAD);
        }
    }
}

module.exports = Architect;