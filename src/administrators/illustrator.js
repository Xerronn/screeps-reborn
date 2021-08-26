//Entity that handles visuals
class Illustrator {
    constructor() {
    }

    /**
     * Method that draws map and room visuals
     */
    illustrate() {
        //todo: map and room visuals
    }

    circle() {
        let result = `<style> #circle {width: 250px; height: 250px; -webkit-border-radius: 125px; -moz-border-radius: 125px; border-radius: 125px; background: red;} </style>`;
        result += `<div id="circle"></div>`;
        console.log(result);
    }
}

module.exports = Illustrator;