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