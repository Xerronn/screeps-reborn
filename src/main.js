// Any modules that you use that modify the game's prototypes should be require'd
// before you require the profiler.
const Imperator = require("./administrators/imperator");
const TaskMaster = require("./administrators/taskmaster");
const Archivist = require("./administrators/archivist");
const Illustrator = require("./administrators/illustrator");
const Architect = require("./administrators/architect");
const Informant = require("./administrators/informant");

//init high level entities
global.TaskMaster = new TaskMaster();
global.Archivist = new Archivist();
global.Imperator = new Imperator();
global.Illustrator = new Illustrator();
global.Architect = new Architect();
global.Informant = new Informant();

global.Archivist.build();
global.Imperator.initialize();
console.log("<b>--------Global Reset--------</b>");

module.exports.loop = function() {
    let startcpu = Game.cpu.getUsed();
    //refresh all wrapper objects to live objects
    global.Imperator.refresh();

    //scheduler tasks
    global.TaskMaster.run();
    
    //run logic for game objects
    global.Imperator.run();
}