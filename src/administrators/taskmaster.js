//Entity that manages task execution
class TaskMaster {
    constructor() {
        //TaskMaster manages a scheduler system that can schedule tasks for ticks in the future
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
    schedule(room, tick, task, objArr=undefined) {
        if (!Memory.scheduler[room]) {
            Memory.scheduler[room] = {};
        }
        if (!Memory.scheduler[room][tick.toString()]) {
            Memory.scheduler[room][tick.toString()] = {};
        }
        let taskObj = {
            "script": task,
            "objArr": objArr
        };
        let taskId = this.makeId();
        Memory.scheduler[room][tick.toString()][taskId] = taskObj;
    }
    
    /**
     * Function that executes the schedule
     */
    run() {
        for (let room in Memory.scheduler) {
            for (let tick in Memory.scheduler[room]) {
                if (parseInt(tick) <= Game.time) {
                    for (let id in Memory.scheduler[room][tick]) {
                        let task = Memory.scheduler[room][tick][id];
                        let objArr = task.objArr;
                        eval(task.script);
                    }
                    delete Memory.scheduler[room][tick];
                }
            }
        }
    }

    /**
     * Method to run a specific task based on the task ID
     * @param {String} room 
     * @param {String} taskId 
     * @returns 
     */
    runTask(room, taskId) {
        for (let tick in Memory.scheduler[room]) {
            for (let id in Memory.scheduler[room][tick]) {
                if (id === taskId) {
                    let task = Memory.scheduler[room][tick][id];
                    let objArr = task.objArr;
                    eval(task.script);
                    delete Memory.scheduler[room][tick][id];
                    return true;
                }
            }
            
        }
        return false;
    }

    /**
     * Delete all instances of tasks using provided script
     * @param {String} script the script to find
     */
    deleteTask(script) {
        
    }

    /**
     * Method that generates a unique ID
     * @returns ID
     */
    makeId(length = 7) {
        let result = '';
        for (let i = 0; i < length; i++) {
            result += String.fromCharCode(Math.floor(Math.random() * (65536)));
        }
        return result;
    }
}

module.exports = TaskMaster;