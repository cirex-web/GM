
/*

..TODO: monitor the add class function isntead of the actual buttons for sidebar opening. (user interaction) 

// TODO: Add loading screen
Percent for analysis

Breakout rooms
Presentation

Listen for object arrival in the beginning before starting loop

Listen in for class additions/deletions to each of the speaker things


Data goes to chat which goes to server once no more messages are sent for the next min.
*/
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
    LIST_ITEM:{
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
    for (n of Object.keys(ELEMENTS)) {
        ELEMENTS[n] = new El(ELEMENTS[n]);
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
let interval;

let utilFunctions = {
    REMOVE_CLASS: {
        snippet: "a.classList.remove(b)",
        func: (a, b) => {

            if (matches(a, ELEMENTS.SIDE_BAR) && b == CLASS_NAMES.SIDEBAR_OPEN) {
                local.clicked_sidebar = false; 
                
                if (local.sidebar_init.phase_one && !local.sidebar_init.phase_two) {
                    local.sidebar_init.phase_two = true;
                }
                return false;
            }
            
            return true;
        }
    },
    ADD_CLASS: {
        snippet: "a.classList.add(b)",
        func: (a, b) => {
            if (matches(a, ELEMENTS.SIDE_BAR) && b == CLASS_NAMES.SIDEBAR_OPEN) {
                if (!local.sidebar_init.phase_one) {
                    local.sidebar_init.phase_one = true;
                } else {
                    local.clicked_sidebar = true;
                }
            }else if(matches(a,ELEMENTS.VOLUME_OUTPUT)){
                updateSpeakerData(a,b);
            }
            return true;
        }
    }
}
function updateSpeakerData(speaker_el, class_added){
    let list_container = getListItem(speaker_el);

    if(list_container!=null && !speaker_el.parentElement.classList.contains(CLASS_NAMES.USER_MUTED)){
        if(class_added==CLASS_NAMES.NO_SOUND){
            speaker_el.style.background = "white";
        }else{
            speaker_el.style.background = "green";
        }

    }
}
function matches(element, obj) {
    return element.getAttribute(obj.type) == obj.str;
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
                        console.log("clicked x");
                        if (local.sidebar_init.phase_two) {
                            clearInterval(loop);
                            console.log("good to go!");
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
function getListItem(el){
    while((el=el.parentElement)&&!matches(el,ELEMENTS.LIST_ITEM));
    return el;
}
// See which students haven't spoken yet in class
/*
For preserving video width

window.default_MeetingsUi.ii = function (a) {
    let width = 0;
    if (typeof (window.innerWidth) == 'number') {
        width = window.innerWidth;
    } else if (document.documentElement && (document.documentElement.clientWidth || document.documentElement.clientHeight)) {
        width = document.documentElement.clientWidth;
    } else if (document.body && (document.body.clientWidth || document.body.clientHeight)) {
        width = document.body.clientWidth;
    }
    return new window.default_MeetingsUi.Ef(width, a.height);
}
TODO: Possibly remove Ef altogether
*/

/*
    find function with (si)
    a.style.width
    a.style.height

    and other one with (oi)
    a.style.left
    a.style.top

tiles' jsname is E2KThb


e3d probably passes in data about tile container. (like width and height)
variable called a has this thing but only inside e3d local var.
- a.Da.v4() gets dimensions
We change width somehow
*/