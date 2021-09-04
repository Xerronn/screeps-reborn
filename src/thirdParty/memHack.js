function memHack(mainLoop) {
    let memory;
    let tick;
    
    return () => {
        if (tick && tick + 1 === Game.time && memory) {
        delete global.Memory;
        Memory = memory;
        } else {
        memory = Memory;
        }
    
        tick = Game.time;
    
        mainLoop();
    
        //RawMemory.set(JSON.stringify(Memory));
        RawMemory._parsed = Memory;
    };
}

module.exports = memHack;