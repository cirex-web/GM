
/*
*/

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
    fetchEl: (name) => {
        return $("[jscontroller=" + name + "]")
    }
}
let CLASS_NAMES = {
    SIDEBAR_OPEN: "kjZr4"
}
//The elements with only jsname
let OTHER = {
    SIDEBAR_CONTENT: "o4MlPd",
    fetchEl: (name) => {
        this[name + "_EL"] = $("[jsname=" + name + "]");
        return this[name + "_EL"];
    }
}
let local = {
    clicked_sidebar: false,
    sidebar_hidden: false,
    analyzed: false
}

let toAnalyze = [BUTTONS, NAV, OTHER];



/*
Remove class eLNT1d from jscontroller ur4S3c
Remove class fT3JUc from kAPMuc 

Change css jscontroller pGdfBb to transform: translate3d(100%,0,0);

*/
let interval = setInterval(run, 100);




function run() {
    try {

        if (inCall()) {
            if (!local.analyzed) {
                setUpRefs();
                if (!barOpen()) { //Should only be like this in the beginning
                    preventBarFromClosing();

                    NAV.SIDE_BAR_EL.arrive(BUTTONS.formQuery(BUTTONS.CLOSE), () => {
                        console.log(BUTTONS.fetchEl(BUTTONS.CLOSE).click());
                        console.log("clicking the x button");
                        $(document).unbindArrive();

                    });
                    BUTTONS.SHOW_USERS_EL.click();
                    addStaticListeners();


                }
            }

            if (!local.clicked_sidebar && !local.sidebar_hidden) {
                NAV.SIDE_BAR_EL.css("transition-delay", "0s");

                console.log("closing bar");
                NAV.SIDE_BAR_EL.css("transform", "translate3d(0,100px,0)");
                local.sidebar_hidden = true;
            } else if (local.clicked_sidebar && local.sidebar_hidden) {
                NAV.SIDE_BAR_EL.css("transition-delay", "");
                NAV.SIDE_BAR_EL.css("transform", "translate3d(0,0,0)");
                local.sidebar_hidden = false;

            }


        } else {
            local.analyzed = false;
            local.clicked_sidebar = false;

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
            return;
        }
        a.classList ? a.classList.remove(b) : window.default_MeetingsUi.ai(a, b) && window.default_MeetingsUi.gia(a, window.default_MeetingsUi.fd(window.default_MeetingsUi.fia(a), function (c) {
            return c != b
        }).join(" "))
    }

}
function setUpRefs() {
    toAnalyze.forEach((el) => {
        // console.log(el);
        Object.keys(el).forEach((key) => {
            if (typeof el[key] == 'string') {
                el[key + "_EL"] = el.fetchEl(el[key]);
            }
        });
    });
    local.analyzed = true;

}
function addStaticListeners() {
    BUTTONS.SHOW_USERS_EL.add(BUTTONS.SHOW_CHAT_EL).click(() => {
        local.clicked_sidebar = true;
        addVolatileListeners();
    });
}
function addVolatileListeners() {

    BUTTONS.fetchEl(BUTTONS.CLOSE).click(() => {
        console.log("user closing bar...");
        local.clicked_sidebar = false;

    });
}
function inCall() {
    return BUTTONS.fetchEl(BUTTONS.PRESENT).length != 0;
}
function barOpen() {
    // return OTHER.fetchEl(OTHER.SIDEBAR_CONTENT).html()!=="";
    return NAV.fetchEl(NAV.SIDE_BAR).hasClass(CLASS_NAMES.SIDEBAR_OPEN);
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