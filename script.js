
/*


TODO: monitor the side panel for new user joining and initialize in both user and meeting
TODO: Update user database (in storage) every time it changes


*/


// Later
//TODO: Aria labels don't work in other languages
// TODO: Add loading screen

// Very later
//TODO: Change storage to sync
try {
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
        },
        VOLUME_CONTAINER:{
            str: "mUJV5",
            type: "jscontroller"
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
                    } else if (matches(a, ELEMENTS.VOLUME_OUTPUT)||matches(a,ELEMENTS.VOLUME_CONTAINER)) {
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
    Storage.prototype.setObject = function (key, value) {
        this.setItem(key, JSON.stringify(value));
    }
    Storage.prototype.getObject = function (key) {
        var value = this.getItem(key);
        return value && JSON.parse(value);
    }
    //TODO: delete @above
    let meet_code = $('[data-meeting-code]').attr('data-meeting-code') || $('[data-unresolved-meeting-id]').attr('data-unresolved-meeting-id');
    let interval;
    let meeting_data, user_database, meeting_database;

    for (n of Object.keys(ELEMENTS)) {
        ELEMENTS[n] = new El(ELEMENTS[n]);
    }
    injectFunctions();
    $("data_transfer")[0].addEventListener('data', function (e) {
        meeting_data = e.detail.meeting_data;
        user_database = e.detail.user_database;
        meeting_database = e.detail.meeting_database;


        //TODO: Find relevant meeting... if none, go default.
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
    function prepareToRun() {
        if (meeting_data && user_database) {



            interval = setInterval(run, 100);

        } else {
            setTimeout(() => {
                prepareToRun();
            }, 500);
        }

    }
    function run() {

        try {
            if (inCall()) {
                if (!barOpen()) { //Should only be like this in the beginning
                    let side = ELEMENTS.SIDE_BAR.getEl();
                    side.arrive(ELEMENTS.CLOSE.formQuery(), () => {

                        const loop = setInterval(() => {

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
    function registerUsers() {
        try {
            for (el of ELEMENTS.LIST_ITEM.getEl()) {
                const USER_ID = getUserID(el);
                const USER_NAME = el.querySelector("." + CLASS_NAMES.USER_NAME).innerHTML;
                let user = user_database[USER_ID];
                if (!user) {
                    user_database[USER_ID] = {
                        TIME_CREATED: + new Date(),
                        NAME: USER_NAME,
                        IMG_ID: USER_ID
                    }
                } else {
                    user.NAME = USER_NAME;
                }
                console.log(user_database);
                let user_in_meet = meeting_data.user_data[USER_ID];
                meeting_data.user_data[USER_ID] = {
                    speaking_time: user_in_meet ? user_in_meet.speaking_time : 0,
                    is_speaking: false,
                    before_time: undefined,
                    cur_interval: -1
                };
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
            let user = meeting_data.user_data[getUserID(list_container)];
            if(class_added === CLASS_NAMES.USER_MUTED){
                console.log("hit!");
                stopTrackingUserTime(user, list_container);
            }else if (!speaker_el.parentElement.classList.contains(CLASS_NAMES.USER_MUTED)) {
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
        }

    }
    function getUserID(list_el) {
        return list_el.querySelector("." + CLASS_NAMES.USER_ICON).src.toString().split("/").pop();
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
} catch (e) {
    console.log(e);
}
