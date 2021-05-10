let BUTTONS = {
    SHOW_USERS: "Show everyone",
    SHOW_CHAT: "Chat with everyone",
    CLOSE: "Close",
    PRESENT: "Present now",
    fetchEl: function (name) {
        return $(this.formQuery(name));
    },
    formQuery: function (name) {
        return "[aria-label='" + name + "']";
    }
}

let NAV = {
    BOTTOM_BAR: "kAPMuc",
    TOP_BAR: "ur4S3c",
    SIDE_BAR: "pGdfBb",
    SPEAKER_BARS: "ES310d",
    
    fetchEl: (name) => {
        return $("[jscontroller=" + name + "]")
    }
}
let OTHER = {
    SIDEBAR_CONTENT: "o4MlPd",
    fetchEl: (name) => {
        this[name + "_EL"] = $("[jsname=" + name + "]");
        return this[name + "_EL"];
    }
}
function injectFunctions() {
    let f = false;
    for (let [name, original_func] of Object.entries(window.default_MeetingsUi)) {
        if (!original_func || typeof original_func != "function") continue;
        for (injectObj of Object.values(utilFunctions)) {

            if (Function.prototype.toString.call(original_func).includes(injectObj.snippet)) {
                f = true;
                console.log(name);
                window.default_MeetingsUi[name] = inject(injectObj.func, original_func);
            }
        }
    }
    // if (!f) console.log("houston we got a problem");
}
function barOpen() {
    // return OTHER.fetchEl(OTHER.SIDEBAR_CONTENT).html()!=="";
    return ELEMENTS.SIDE_BAR.getEl().hasClass(CLASS_NAMES.SIDEBAR_OPEN);
}