// Any modules that you use that modify the game's prototypes should be require'd
// before you require the profiler.
const executive = require("./administrators/executive");
const Originator = require("./administrators/originator");
const profiler = require("./administrators/profiler");

// This line monkey patches the global prototypes.
profiler.enable();
module.exports.loop = function() {
    profiler.wrap(function() {
        if (!global.INITIALIZED) {
            global.Originator = new Originator();
            global.INITIALIZED = true;
        }
        global.Originator.refresh();
    });
}