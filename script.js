
/*


TODO: monitor the side panel for new user joining and initialize in both user and meeting
TODO: Update user database (in storage) every time it changes


*/


// Later
//TODO: Aria labels don't work in other languages
// TODO: Add loading screen

// Very later
//TODO: Change storage to sync

let ELEMENTS = {
    SHOW_USERS: {
        str: "Show everyone",
        type: "aria-label"
    },
    CLOSE: {
        str: "Close",
        type: "aria-label"
    },
    SIDE_BAR: {
        str: "pGdfBb",
        type: "jscontroller"
    },
    SPEAKER_BARS: {
        str: "ES310d",
        type: "jscontroller"
    },
    SIDEBAR_CONTENT: {
        str: "o4MlPd",
        type: "jsname"
    },
    VOLUME_OUTPUT: {
        str: "QgSmzd",
        type: "jsname"
    },
    LIST_ITEM: {
        str: "listitem",
        type: "role"
    }
}

class El {
    constructor(obj) {
        this.str = obj.str;
        this.type = obj.type;
    }
    getEl() {
        return $(this.formQuery());
    }
    formQuery() {
        return "[" + this.type + "='" + this.str + "']";
    }
}

let CLASS_NAMES = {
    SIDEBAR_OPEN: "kjZr4",
    USER_NAME: "ZjFb7c",
    USER_YOU: "QMC9Zd",
    USER_MUTED: "FTMc0c",
    USER_ICON: "G394Xd",
    NO_SOUND: "gjg47c"
}

let local = {
    clicked_sidebar: false,
    sidebar_hidden: false,
    sidebar_init: {
        phase_one: false,
        phase_two: false
    }
}


let utilFunctions = {
    REMOVE_CLASS: {
        snippet: "a.classList.remove(b)",
        func: (a, b) => {
            try{
                if (matches(a, ELEMENTS.SIDE_BAR) && b == CLASS_NAMES.SIDEBAR_OPEN) {
                    local.clicked_sidebar = false;
    
                    if (local.sidebar_init.phase_one && !local.sidebar_init.phase_two) {
                        local.sidebar_init.phase_two = true;
                    }
                    return false;
                }
    
                return true;
            }catch(e){
                console.log(e);
                return false;
            }

        }
    },
    ADD_CLASS: {
        snippet: "a.classList.add(b)",
        func: (a, b) => {
            try{
                if (matches(a, ELEMENTS.SIDE_BAR) && b == CLASS_NAMES.SIDEBAR_OPEN) {
                    if (!local.sidebar_init.phase_one) {
                        local.sidebar_init.phase_one = true;
                    } else {
                        local.clicked_sidebar = true;
                    }
                } else if (matches(a, ELEMENTS.VOLUME_OUTPUT)) {
                    updateSpeakerData(a, b);
                }
                return true;
            }catch(e){
                console.log(e);
                return false;
            }
        }
    }
}
Storage.prototype.setObject = function(key, value) {
    this.setItem(key, JSON.stringify(value));
}
Storage.prototype.getObject = function(key) {
    var value = this.getItem(key);
    return value && JSON.parse(value);
}
let user_database = localStorage.getObject("users") || []; //TODO: Change to extension storage and delete @above
let interval;
let meeting_data = {
    lastUpdated: + new Date(),
    meeting_code: undefined, //TODO: set this to meeting URL ending
    user_data:{} //TODO: see if data for this meeting already exists
};

for (n of Object.keys(ELEMENTS)) {
    ELEMENTS[n] = new El(ELEMENTS[n]);
}
injectFunctions();

document.arrive(ELEMENTS.SHOW_USERS.formQuery(), () => {
    interval = setInterval(run, 100);
});
function run() {

    try {
        if (inCall()) {
            if (!barOpen()) { //Should only be like this in the beginning
                let side = ELEMENTS.SIDE_BAR.getEl();
                side.arrive(ELEMENTS.CLOSE.formQuery(), () => {

                    const loop = setInterval((id) => {

                        ELEMENTS.CLOSE.getEl().click();
                        if (local.sidebar_init.phase_two) {
                            registerUsers();
                            clearInterval(loop);
                        }
                    }, 50);
                    $(side).unbindArrive();
                });
                ELEMENTS.SHOW_USERS.getEl().click();
            }


            if (!local.clicked_sidebar && !local.sidebar_hidden) {
                ELEMENTS.SIDE_BAR.getEl().css("transition-delay", "0s");
                ELEMENTS.SIDE_BAR.getEl().css("transform", "translate3d(0,100px,0)");
                local.sidebar_hidden = true;
            } else if (local.clicked_sidebar && local.sidebar_hidden) {
                ELEMENTS.SIDE_BAR.getEl().css("transition-delay", "");
                ELEMENTS.SIDE_BAR.getEl().css("transform", "translate3d(0,0,0)");
                local.sidebar_hidden = false;
            }

        } else {
            local.clicked_sidebar = false;
            local.sidebar_hidden = false;
            local.sidebar_init.phase_one = false;
            local.sidebar_init.phase_two = false;
            clearInterval(interval);
        }
    } catch (e) {
        console.log(e);
    }
}
function registerUsers(){
    for(el of ELEMENTS.LIST_ITEM.getEl()){
        let USER_ID = getUserID(el);
        let USER_NAME = el.querySelector("."+CLASS_NAMES.USER_NAME).innerHTML;
        user_database[USER_ID] = USER_NAME;
        meeting_data.user_data[USER_ID] = {
            speaking_time: 0,
            is_speaking: false,
            before_time: undefined,
            cur_interval: -1
        };
    }
    sendMeetingData();
}
function inCall() {
    return ELEMENTS.SHOW_USERS.getEl().length > 0;
    // return $("[data-allocation-index]").length>0;
}
function barOpen() {
    // return OTHER.fetchEl(OTHER.SIDEBAR_CONTENT).html()!=="";
    return ELEMENTS.SIDE_BAR.getEl().hasClass(CLASS_NAMES.SIDEBAR_OPEN);
}
function inject(before, fn) {
    return function () {
        try {
            if (before.apply(this, arguments)) {
                fn.apply(this, arguments);
            }
        } catch (e) {
            console.log(e);
        }

    }
}
function injectFunctions() {
    for ([name, original_func] of Object.entries(window.default_MeetingsUi)) {
        if (!original_func || typeof original_func != "function") continue;
        for (injectObj of Object.values(utilFunctions)) {

            if (Function.prototype.toString.call(original_func).includes(injectObj.snippet)) {
                console.log(name);
                window.default_MeetingsUi[name] = inject(injectObj.func, original_func);
            }
        }
    }
}
function getListItem(el) {
    while ((el = el.parentElement) && !matches(el, ELEMENTS.LIST_ITEM));
    return el;
}
function updateSpeakerData(speaker_el, class_added) {
    let list_container = getListItem(speaker_el);

    if (list_container != null && !speaker_el.parentElement.classList.contains(CLASS_NAMES.USER_MUTED)) {
        let user = meeting_data.user_data[getUserID(list_container)];

        if (class_added == CLASS_NAMES.NO_SOUND) {
            list_container.style.background = "white";
            if(user.cur_interval!=-1){
                clearInterval(user.cur_interval);
                user.cur_interval = -1;
                user.is_speaking = false;
                user.before_time = false;
            }
        } else {
            if(!user.is_speaking){
                user.is_speaking = true;
                user.cur_interval = addTimeToUser(user);
            }
            list_container.style.background = "green";
        }
    }
}
function getUserID(list_el){
    return list_el.querySelector("."+CLASS_NAMES.USER_ICON).src.toString().split("/").pop();
}
function addTimeToUser(user){
    if(!user.before_time){
        user.before_time = + new Date();
    }
    return setInterval(()=>{
        let cur_time = new Date();
        user.speaking_time+= cur_time - user.before_time;
        user.before_time = cur_time;
        sendMeetingData();
    },10);
}
function matches(element, obj) {
    return element.getAttribute(obj.type) == obj.str;
}
function sendMeetingData(){
    const event = new CustomEvent('terry_time', {
        detail: {
            meeting: meeting_data,
            users: user_database
        }
    });
    $("data_transfer")[0].dispatchEvent(event);
}