const Originator = require("./originator");

//Entity that manages task execution
class Executive {
    /**
     * Constructor for executive, links it to an Originator Object permanently
     * @param {Originator} Originator 
     */
    constructor(Originator) {
        this.originator = Originator;

        //Executive manages a scheduler system that can schedule tasks for ticks in the future
        //Due to global resets, this will have to be stored in memory.
        this.initScheduler();
    }

    /**
     * Function that checks to see if the scheduler memory pathway has been created
     * If it has, it will set references to the memory pathway, if not it will create it.
     */
    initScheduler() {
        
    }
    
    /**
     * Function that executes tasks for all Game objects in the Originator
     */
    execute() {

    }
}

module.exports = Executive;