// Any modules that you use that modify the game's prototypes should be require'd
// before you require the profiler.
const Imperator = require("./administrators/imperator");
const Executive = require("./administrators/executive");
const Archivist = require("./administrators/archivist");

//init high level entities
global.Executive = new Executive();
global.Archivist = new Archivist();

global.Imperator = new Imperator();
global.Archivist.build();
global.Imperator.initialize();
console.log("<b>--------Global Reset--------</b>");

module.exports.loop = function() {
    let startcpu = Game.cpu.getUsed();
    //refresh should probably be one of the first things done.
    global.Imperator.refresh();
    global.Executive.execute();
    global.Imperator.run();
}