const Imperator = require("./administrators/imperator");
const TaskMaster = require("./administrators/taskmaster");
const Archivist = require("./administrators/archivist");
const Illustrator = require("./administrators/illustrator");
const Architect = require("./administrators/architect");
const Informant = require("./administrators/informant");
const Vendor = require("./administrators/vendor");

const Traveler = require("./thirdParty/traveler");
const memHack = require("./thirdParty/memHack");

//init high level entities
global.TaskMaster = new TaskMaster();
global.Archivist = new Archivist();
global.Imperator = new Imperator();
global.Illustrator = new Illustrator();
global.Architect = new Architect();
global.Informant = new Informant();
global.Vendor = new Vendor();

global.Archivist.build();
global.Imperator.initialize();
global.Vendor.appraise();
global.Vendor.clean();
console.log("<b>--------Global Reset--------</b>");

module.exports.loop = memHack(function() {
    let startcpu = Game.cpu.getUsed();
    //refresh all wrapper objects to live objects
    global.Imperator.refresh();

    //scheduler tasks
    global.TaskMaster.run();
    
    //run logic for game objects
    global.Imperator.run();

    //map and room visuals
    global.Illustrator.illustrate();
});