//Entity that manages task execution
class Executive {
    /**
     * Constructor for executive
     */
    constructor() {
        //Executive manages a scheduler system that can schedule tasks for ticks in the future
        //Due to global resets, this will have to be stored in memory.
        this.initScheduler();
    }

    /**
     * Function that checks to see if the scheduler memory pathway has been created
     * If it has, it will set references to the memory pathway, if not it will create it.
     */
    initScheduler() {
        if (!Memory.scheduler) {
            Memory.scheduler = {};
        }
    }

    /**
     * Function that schedules task on tick referencing objects in objArr if needed
     * @param {Number} tick 
     * @param {String} task 
     * @param {Array} objArr 
     */
    schedule(tick, task, objArr=null) {
        //todo: make an id system so we can cancel tasks too
        if (!Memory.scheduler[tick.toString()]) {
            Memory.scheduler[tick.toString()] = [];
        }
        let taskObj = {
            "script": task,
            "objArr": objArr
        };
        Memory.scheduler[tick.toString()].push(taskObj);
    }
    
    /**
     * Function that executes the schedule
     */
    execute() {
        //execute scheduler code
        for (var tick of Object.keys(Memory.scheduler)) {
            if (parseInt(tick) <= Game.time) {
                for (var task of Memory.scheduler[tick]) {
                    let objArr = task.objArr;
                    eval(task.script);
                }
                delete Memory.scheduler[tick];
            }
        }
    }
}

module.exports = Executive;