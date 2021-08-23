const Castrum = require("./castrum");

//lab class definition
class Workshop extends Castrum {
    constructor(labId) {
        super(labId);

        let anchor = global.Archivist.getAnchor(this.room);
        this.type = classifyLab({
            "x": this.pos.x - anchor.x,
            "y": this.pos.y - anchor.y
        });
    }
}

/**
 * Function that takes anchor coordinates and calculates what type of lab it is
 * @param {Object} roomPosition 
 * @returns Lab classification
 */
function classifyLab(roomPosition) {
    let simple = [{"x":8,"y":7},{"x":7,"y":8}];
    let medium = [{"x":9,"y":7}, {"x":7,"y":9}];
    let advanced = [{"x":9,"y":8}, {"x":8,"y":9}];
    let complex = [{"x":10,"y":8}, {"x":8,"y":10}];
    let product = [{"x":10,"y":9},{"x":9,"y":10}];

    let types = {
        "simple": simple, 
        "medium": medium, 
        "advanced": advanced, 
        "complex": complex, 
        "product": product
    };

    for (let type in types) {
        for (let coords of types[type]) {
            if (coords.x == roomPosition.x && coords.y == roomPosition.y) {
                return type;
            }
        }
    }
}

module.exports = Workshop;