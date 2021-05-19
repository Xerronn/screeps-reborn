// Any modules that you use that modify the game's prototypes should be require'd
// before you require the profiler.
const executive = require("./administrators/executive");
const Originator = require("./administrators/originator");
const Illustrator = require("./administrators/illustrator")
const profiler = require("./administrators/profiler");
global.Originator = new Originator();

// This line monkey patches the global prototypes.
profiler.enable();
module.exports.loop = function() {
    profiler.wrap(function() {
        global.Originator.refresh();
    });
}