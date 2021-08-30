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
        let keys = Object.keys(Memory.scheduler[room][tick.toString()]);
        let taskId = keys[keys.length - 1] || 0;
        Memory.scheduler[room][tick.toString()][taskId] = taskObj;

        let re = /([^(]+)@|at ([^(]+) \(/g;
        let aRegexResult = re.exec(new Error().stack);
        let sCallerName = aRegexResult[1] || aRegexResult[2];
        console.log(sCallerName);
    }
    
    /**
     * Function that executes the schedule
     */
    run() {
        //execute scheduler code
        for (var tick of Object.keys(Memory.scheduler)) {
            if (["E42N24", "E41N22", "global"].includes(tick)) continue;
            if (parseInt(tick) <= Game.time) {
                for (var task of Memory.scheduler[tick]) {
                    try {
                    let objArr = task.objArr;
                    eval(task.script);
                    } catch (err) {}
                }
                delete Memory.scheduler[tick];
            }
        }

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
     * Delete all instances of tasks using provided script
     * @param {String} script the script to find
     */
    deleteTask(script) {
        let schedule = Memory.scheduler;

        for (let tick in schedule) {
            for (let task in tick) {
                if (tick[task].script == script) {
                    console.log(tick[task].script)
                    // tick.splice(task, 1);
                }
            }
        }
    }
}

module.exports = TaskMaster;