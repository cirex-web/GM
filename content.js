
/*
Remove jscontroller from close button (maybe everytime it opens?) to prevent lost data
Simulate bar closing and opening
Add in the other classes to make it more convincing.
*/

let BUTTONS = {
    SHOW_USERS: "Show everyone",
    SHOW_CHAT: "Chat with everyone",
    CLOSE: "Close",
    PRESENT: "Present now",
    fetchEl: (name) => {
        return $("[aria-label='" + name + "']");
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
        return $("[jsname=" + name + "]");
    }
}
let local = {
    clicked_sidebar: false,
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
    console.log("running");
    if (inCall()) {
        if (!local.analyzed) {
            setUpRefs();
            addListeners();
        }

        // clearInterval(interval);
        if (!barOpen()) {
            BUTTONS.SHOW_USERS1.click();
            console.log("attempting to reopen");
        }

    } else {
        local.analyzed = false;
        local.clicked_sidebar = false;

    }

}
function setUpRefs() {
    toAnalyze.forEach((el) => {
        // console.log(el);
        Object.keys(el).forEach((key) => {
            if (typeof el[key] == 'string') {
                el[key + "1"] = el.fetchEl(el[key]);
            }
        });
    });
    local.analyzed = true;

}
function addListeners() {
    BUTTONS.CLOSE1.click(() => {
        local.clicked_sidebar = false;
    }); // TODO: This doesn't work because close button doesn't exist yet.
    BUTTONS.SHOW_USERS1.add(BUTTONS.SHOW_CHAT1).click(() => {
        local.clicked_sidebar = true;
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