const GameObj = require("../GameObj");

//the parent construct definition
class Construct extends GameObj {
    constructor(constructId) {
        super(constructId);
    }
}

module.exports = Construct;