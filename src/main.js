// Any modules that you use that modify the game's prototypes should be require'd
// before you require the profiler.
const Executive = require("./administrators/executive");
const Imperator = require("./administrators/imperator");
const Initiator = require("./administrators/initiator");

//init higher level entities
global.Imperator = new Imperator();
global.Executive = new Executive();
global.Initiator = new Initiator();
console.log("<b>--------Global Reset--------</b>");

// This line monkey patches the global prototypes.

module.exports.loop = function() {
    let startcpu = Game.cpu.getUsed();
    global.Imperator.refresh();
    global.Executive.execute();
    console.log(Game.cpu.getUsed() - startcpu);
}