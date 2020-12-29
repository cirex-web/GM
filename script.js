
/*

//TODO: adjust injected function so it moves the thing down
..TODO: monitor the add class function isntead of the actual buttons for sidebar opening. (user interaction) 


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
    SHOW_CHAT: {
        str: "Chat with everyone",
        type: "aria-label"
    },
    CLOSE: {
        str: "Close",
        type: "aria-label"
    },
    PRESENT: {
        str: "Present now",
        type: "aria-label"
    },
    BOTTOM_BAR: {
        str: "kAPMuc",
        type: "jscontroller"
    },
    TOP_BAR: {
        str: "ur4S3c",
        type: "jscontroller"
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
try{
    for (n of Object.keys(ELEMENTS)) {
        ELEMENTS[n] = new El(ELEMENTS[n]);
    }
    
}catch(e){
    console.log(e);
}

let CLASS_NAMES = {
    SIDEBAR_OPEN: "kjZr4",
    MUTED: "FTMc0c"
}

let local = {
    clicked_sidebar: false,
    sidebar_hidden: false,
    sidebar_init: false,
}
let interval;

let utilFunctions = {
    REMOVE_CLASS: {
        snippet: "a.classList.remove(b)",
        func:(a,b)=>{
            // console.log("I have been injected!");
            // console.log(b,CLASS_NAMES.SIDEBAR_OPEN);
            if (matches(a,ELEMENTS.SIDE_BAR) && b == CLASS_NAMES.SIDEBAR_OPEN) {
                local.clicked_sidebar = false; //TODO: Make it check for both class and place to put class 
                //also check if it eixsts?
                console.log("user closed side panel");
                return false;
            }
            return true;
        }
    },
    ADD_CLASS: {
        snippet: "a.classList.add(b)",
        func:  (a,b)=>{
            if(matches(a,ELEMENTS.SIDE_BAR) &&  b == CLASS_NAMES.SIDEBAR_OPEN){
                if(!local.sidebar_init){
                    console.log("initializing side panel");
                    local.sidebar_init = true;
                }else{
                    console.log("user opened side panel");
                    local.clicked_sidebar = true;
                }
            }
            return true;
            // console.log("same!");
        }
    }
}

function matches(element, obj){
    return element.getAttribute(obj.type)==obj.str;
}

/*
Remove class eLNT1d from jscontroller ur4S3c
Remove class fT3JUc from kAPMuc 

Change css jscontroller pGdfBb to transform: translate3d(100%,0,0);

*/
injectFunctions();
document.arrive(ELEMENTS.SHOW_USERS.formQuery(), () => {
    interval = setInterval(run, 100);
});
function run() {
    try {
        // console.log(inCall());
        if (inCall()) {
            if (!barOpen()) { //Should only be like this in the beginning
                let side = ELEMENTS.SIDE_BAR.getEl();
                side.arrive(ELEMENTS.CLOSE.formQuery(), () => {
                    ELEMENTS.CLOSE.getEl().click();
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
            local.sidebar_init = false;
            clearInterval(interval);
        }
    } catch (e) {
        console.log(e);
    }


}

function preventBarFromClosing() {
    window.default_MeetingsUi.di = function (a, b) {
        // if(a.getAttribute("jscontroller")=="pGdfBb"){
        //     console.log("removing class "+b+" from "+a.getAttribute("jscontroller"));
        // }
        if (b == CLASS_NAMES.SIDEBAR_OPEN) {
            local.clicked_sidebar = false;
            return;
        }
        a.classList ? a.classList.remove(b) : window.default_MeetingsUi.ai(a, b) && window.default_MeetingsUi.gia(a, window.default_MeetingsUi.fd(window.default_MeetingsUi.fia(a), function (c) {
            return c != b
        }).join(" "));
    }

}

function inCall() {
    return ELEMENTS.SHOW_USERS.getEl().length > 0;
    // return $("[data-allocation-index]").length>0;
    // return BUTTONS.fetchEl(BUTTONS.PRESENT).length != 0;
}
function barOpen() {
    // return OTHER.fetchEl(OTHER.SIDEBAR_CONTENT).html()!=="";
    return ELEMENTS.SIDE_BAR.getEl().hasClass(CLASS_NAMES.SIDEBAR_OPEN);
}
function inject(before, fn) {
    return function(){
        try{
            if(before.apply(this, arguments)){
                fn.apply(this, arguments);
            }
        }catch(e){
            console.log(e);
        }

    }
}
function injectFunctions(){
    for([name, original_func] of Object.entries(window.default_MeetingsUi)){
        if(!original_func||typeof original_func != "function")continue;
        for(injectObj of Object.values(utilFunctions)){

            if(Function.prototype.toString.call(original_func).includes(injectObj.snippet)){
                console.log(name);
                window.default_MeetingsUi[name] = inject(injectObj.func,original_func);
            }
        }
    }
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