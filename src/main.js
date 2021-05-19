// Any modules that you use that modify the game's prototypes should be require'd
// before you require the profiler.
const executive = require("./administrators/executive");
const Proletarian = require("./proletariat/proletarian");
const Archon = require("./proletariat/archon")
const profiler = require("./administrators/profiler");

// This line monkey patches the global prototypes.
profiler.enable();
module.exports.loop = function() {
    profiler.wrap(function() {
        var test1 = new Proletarian();
        var test2 = new Archon("this is a test");

        test1.test()
        test2.test()
    });
}