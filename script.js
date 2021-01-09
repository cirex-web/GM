
/*


TODO: monitor the side panel for new user joining and initialize in both user and meeting
TODO: Update user database (in storage) every time it changes


*/


// Later
//TODO: Aria labels don't work in other languages
// TODO: Add loading screen

// Very later
//TODO: Change storage to sync
// try {
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
    SIDE_BAR: {
        str: "Yz8Ubc",
        type: "jsname"
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
    },
    VOLUME_CONTAINER: {
        str: "mUJV5",
        type: "jscontroller"
    },
    PARTICIPANTS_TAB: {
        str: "1",
        type: "data-tab-id"
    },
    CHAT_TAB: {
        str: "2",
        type: "data-tab-id"
    },
    PEOPLE_NUM: {
        str:"EydYod",
        type:"jsname"
    },
    MEETING_NICKNAME:{
        str: "rQC7Ie",
        type:"jsname"
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
    },
    registered_users: false,
    dynamic: {
        processing_sidebar:false
    }
}


let utilFunctions = {
    REMOVE_CLASS: {
        snippet: "a.classList.remove(b)",
        func: (a, b) => {
            try {
                if (matches(a, ELEMENTS.SIDE_BAR) && b == CLASS_NAMES.SIDEBAR_OPEN) {
                    local.clicked_sidebar = false;

                    if (local.sidebar_init.phase_one && !local.sidebar_init.phase_two) {
                        local.sidebar_init.phase_two = true;
                    }
                    return false;
                }

                return true;
            } catch (e) {
                console.log(e);
                return false;
            }

        }
    },
    ADD_CLASS: {
        snippet: "a.classList.add(b)",
        func: (a, b) => {
            try {

                if (matches(a, ELEMENTS.SIDE_BAR) && b == CLASS_NAMES.SIDEBAR_OPEN) {
                    if (!local.sidebar_init.phase_one) {
                        local.sidebar_init.phase_one = true;
                    } else {
                        local.clicked_sidebar = true;
                    }
                } else if (matches(a, ELEMENTS.VOLUME_OUTPUT) || matches(a, ELEMENTS.VOLUME_CONTAINER)) {
                    updateSpeakerData(a, b);
                }
                return true;
            } catch (e) {
                console.log(e);
                return false;
            }
        }
    }
}

let meet_code = $('[data-meeting-code]').attr('data-meeting-code') || $('[data-unresolved-meeting-id]').attr('data-unresolved-meeting-id');
let meeting_data, user_database, meeting_database;

for (n of Object.keys(ELEMENTS)) {
    ELEMENTS[n] = new El(ELEMENTS[n]);
}
injectFunctions();
$("data_transfer")[0].addEventListener('data', function (e) {
    meeting_data = e.detail.meeting_data;
    user_database = e.detail.user_database;
    meeting_database = e.detail.meeting_database;


    //Make sure it's an obj

    console.log("meeting data, meeting database, and user database: ", meeting_data, meeting_database, user_database);
    try {
        let found = false;

        for (let meet of meeting_data) {
            if (meet.meeting_code === meet_code) {

                meeting_data = meet;
                found = true;

                break;
            }
        }
        if (!found) {
            meeting_data = meeting_data[meeting_data.length - 1];
            meeting_data.meeting_code = meet_code;

        }
        console.log("cur_meeting: ", meeting_data, meeting_database);


    } catch (e) {
        console.log(e);
    }

});

document.arrive(ELEMENTS.SHOW_USERS.formQuery(), () => {

    prepareToRun();
});
document.arrive(ELEMENTS.LIST_ITEM.formQuery(), () => {
    registerUsers();
});

function prepareToRun() {
    if (meeting_data && user_database) {
        run();
    } else {
        setTimeout(() => {
            prepareToRun();
        }, 500);
    }

}
async function run() {
    while (true) {
        try {
            if (inCall()) {

                if (!local.sidebar_init.phase_two) { //Should only be like this in the beginning
                    ELEMENTS.SHOW_USERS.getEl().click();
                    ELEMENTS.SHOW_CHAT.getEl().attr("jsaction","");
                    let button_clone = ELEMENTS.SHOW_CHAT.getEl().clone();
                    ELEMENTS.SHOW_CHAT.getEl().replaceWith(button_clone);
                    await init_sidebar();
                    ELEMENTS.SHOW_CHAT.getEl().on("click",function(e){
                        e.preventDefault();
                        ELEMENTS.SHOW_USERS.getEl().click();
                        if(!local.dynamic.processing_sidebar){
                            local.dynamic.processing_sidebar = true;
                            setTimeout(()=>{
                                console.log("clicked");
                                ELEMENTS.CHAT_TAB.getEl().click();
                                setTimeout(()=>{
                                    local.dynamic.processing_sidebar = false;
                                },500);
                            },240);
                        }
    
                    });
                }
                let nickname = ELEMENTS.MEETING_NICKNAME.getEl().html().toString();
                meeting_data.nickname = nickname.includes(" ")?undefined:nickname;
                if(!meeting_data.start_time){
                    meeting_data.start_time = + new Date();
                }
                // jQuery.fn.removeAttributes = function() {
                //     return this.each(function() {
                //       var attributes = $.map(this.attributes, function(item) {
                //         return item.name;
                //       });
                //       var img = $(this);
                //       $.each(attributes, function(i, item) {
                //       img.removeAttr(item);
                //       });
                //     });
                // }
                // ELEMENTS.SHOW_CHAT.getEl().removeAttributes();


                if (!local.clicked_sidebar && !local.sidebar_hidden) {
                    ELEMENTS.SIDE_BAR.getEl().css("transition-delay", "0s");
                    // ELEMENTS.SIDE_BAR.getEl().css("height", "1000px");

                    ELEMENTS.SIDE_BAR.getEl().css("transform", "translate3d(100%,0,0)");
                    // ELEMENTS.SIDE_BAR.getEl().css("transform", "translate3d(0,0,0)");
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
                local.registered_users = false;
                break;
            }
            await wait(100);
        } catch (e) {
            console.log(e);
            await wait(1000);
        }
    }

}
function init_sidebar() {
    return new Promise((re) => {
        let side = ELEMENTS.SIDE_BAR.getEl();
        side.arrive(ELEMENTS.CLOSE.formQuery(), { existing: true, onceOnly: true }, () => {
            const loop = setInterval(() => {
                ELEMENTS.CLOSE.getEl().click();
                if (local.sidebar_init.phase_two) {
                    clearInterval(loop);
                    // updateClone();
                    re();
                }
            }, 50);
        });
    });

}
function wait(m) {
    return new Promise((re) => {
        setTimeout(re, m);
    });
}
function updateClone(){
    console.log("cloning sidebar");

    let $cloned_sidebar = ELEMENTS.SIDE_BAR.getEl().clone();
    $cloned_sidebar.css("position", "absolute"); //TODO: Maybe move these into css file
    $cloned_sidebar.css("top", "10px");
    $cloned_sidebar.css("left", "10px");
    $cloned_sidebar.css("width", "360px");
    $cloned_sidebar.each(function() {
        var attributes = $.map(this.attributes, function(item) {
          return item.name;
        });
        var img = $(this);
        $.each(attributes, function(i, item) {
          img.removeAttr(item);
        });
    });
    $cloned_sidebar.prop('id', 'clone');
    $("#clone").remove();
    ELEMENTS.SIDE_BAR.getEl().parent().append($cloned_sidebar);
    let options = {
        childList: true,
        attributes: false,
        characterData: false,
        subtree: false,
        attributeOldValue: false,
        characterDataOldValue: false
    };
    const observer = new MutationObserver(updateClone);
    observer.observe(ELEMENTS.PEOPLE_NUM.getEl()[0], options);


}
function registerUsers() {
    try {
        for (el of ELEMENTS.LIST_ITEM.getEl()) {
            const USER_IMG_URL = getUserImage(el, true);
            const USER_NAME = el.querySelector("." + CLASS_NAMES.USER_NAME).innerHTML;
            const USER_ID = getUserImage(el);
            let user = user_database[USER_ID];
            if (!user) {
                user_database[USER_ID] = {
                    TIME_CREATED: + new Date(),
                    NAME: USER_NAME,
                    IMG_ID: USER_IMG_URL
                }
            } else {
                user.NAME = USER_NAME;
            }
            let user_in_meet = meeting_data.user_data[USER_ID];
            if (!local.registered_users || (local.registered_users && !meeting_data.user_data[USER_ID])) {
                meeting_data.user_data[USER_ID] = {
                    speaking_time: user_in_meet ? user_in_meet.speaking_time : 0,
                    is_speaking: false,
                    before_time: undefined,
                    cur_interval: -1
                };
                local.registered_users = true;
            }
            // console.log("updated user_database", user_database);
            // console.log("meeting_users", meeting_data.user_data);


        }
    } catch (e) {
        console.log("ERORO", e);
    };

    updateStorage();
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
    if (!local.sidebar_init.phase_two) return;

    let list_container = getListItem(speaker_el);
    meeting_data.lastUpdated = + new Date();
    if (list_container != null) {
        let user = meeting_data.user_data[getUserImage(list_container)];

        if (class_added === CLASS_NAMES.USER_MUTED) {
            stopTrackingUserTime(user, list_container);
        } else if (!speaker_el.parentElement.classList.contains(CLASS_NAMES.USER_MUTED)) {
            if (class_added == CLASS_NAMES.NO_SOUND) {
                stopTrackingUserTime(user, list_container);
            } else {
                if (!user.is_speaking) {
                    user.cur_interval = startTrackingUserTime(user, list_container);
                }
            }
        }
    }
}
function stopTrackingUserTime(user, list_container) {
    list_container.style.background = "white";
    if (user.is_speaking) {
        clearInterval(user.cur_interval);
        user.cur_interval = -1;
        user.is_speaking = false;
        user.before_time = false;
        updateStorage();
    }


}
function getUserImage(list_el, full = false) {
    let URL = list_el.querySelector("." + CLASS_NAMES.USER_ICON).src.toString();
    if (full) {
        return URL;
    } else {
        URL = URL.replace("googleusercontent.com", "").replace("https://", "").replaceAll("/", "").replaceAll(".", "");
        return URL;
    }
}
function startTrackingUserTime(user, list_container) {
    if (!user.before_time) {
        user.before_time = + new Date();
    }
    user.is_speaking = true;
    list_container.style.background = "green";
    return setInterval(() => {
        let cur_time = new Date();
        user.speaking_time += cur_time - user.before_time;
        user.before_time = cur_time;
        // console.log(user.speaking_time, meeting_data.user_data[getUserImage(list_container)].speaking_time);
        updateStorage();
    }, 10);
}
function matches(element, obj) {
    return element.getAttribute(obj.type) == obj.str;
}
function updateStorage() {
    const event = new CustomEvent('terry_time', {
        detail: {
            meeting_data: meeting_data,
            user_database: user_database
        }
    });
    $("data_transfer")[0].dispatchEvent(event);
}
// } catch (e) {
//     console.log(e);
// }
