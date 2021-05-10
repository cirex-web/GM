export let Logger = {
    log: (...args)=>{
        console.log("[LOG] ",args);
    },
    info: (...args)=>{
        console.info("[INFO] ",args);
    },
    verbose:  (...args)=>{
        console.info("[VERBOSE] ",args);
    }
}
