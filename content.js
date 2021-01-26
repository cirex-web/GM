// s.setAttribute('data-version', browser.runtime.getManifest().version)

let STR = {
    cur_meetings: "cur_meetings",
    users: "users",
    all_other_meetings: "other_meetings"
}
class Meeting {
    lastUpdated = + new Date(); //TODO: change to last_updated but then that breaks all previous objects
    meeting_code = undefined;
    user_data = {};
    category = "UNCATEGORIZED";
    teacher_IDs = [];
    nickname = undefined;
    start_time = undefined;
}
let debug = false;
let injected_scripts = ["/external/jquery.js", "/external/arrive.js", "script.js"];
let injected_styles = ["injected.css"];
let all_cur_meetings, user_database, cur_meeting, meeting_database, meet_code;

if (window.location.pathname !== "/") {

    $(window).arrive('[jscontroller="ES310d"]', () => {
        $(window).unbindArrive();
        //Actually in a valid meeting
        let el = document.createElement("data_transfer");
        document.body.appendChild(el);


        let promises = [getFromStorage(STR.cur_meetings), getFromStorage(STR.users), getFromStorage(STR.all_other_meetings)];


        Promise.allSettled(promises).then(async (vals) => {
            //Obtaining meeting information from storage and DOM
            all_cur_meetings = vals[0].value || [];
            user_database = vals[1].value || {};
            meeting_database = vals[2].value || {};
            console.log(vals,all_cur_meetings);
            meet_code = $('[data-meeting-code]').attr('data-meeting-code');

            processExpiredMeetings();
            injectScriptsAndStuff();
            addPopupListeners(); 

        });

        addScriptListener();
    });

} else {
    console.log("Not in meet");
}

function processExpiredMeetings() {
    console.log(all_cur_meetings);

    let i = all_cur_meetings.length - 1;
    while (i >= 0) {
        if (isExpired(all_cur_meetings[i])) {
            //Removes meet from current meetings list and puts it into long-term storage
            let removed_meet = all_cur_meetings.splice(i, 1)[0];
            meeting_database[removed_meet.category].push(removed_meet);
        }
        i--;
    }
    all_cur_meetings.push(new Meeting());
    for (let meet of all_cur_meetings) {
        if (meet.meeting_code == meet_code) {
            all_cur_meetings.pop();
            break;
        }
    }

    setInStorage(STR.all_other_meetings, meeting_database);
    setInStorage(STR.cur_meetings, all_cur_meetings);
}
function addScriptListener(){
    $("data_transfer")[0].addEventListener('merge_cur_meeting', async function (e) {
        cur_meeting = e.detail.meeting_data;
        // console.log(cur_meeting);
        let merged = false
        let defaultMeeting = -1;
        for (let [i, meet] of all_cur_meetings.entries()) {
            if (meet.meeting_code == cur_meeting.meeting_code) {
                all_cur_meetings[i] = cur_meeting;
                merged = true;
                break;
            } else if (!meet.meeting_code) {
                defaultMeeting = i;
            }
        }

        if (!merged) {
            all_cur_meetings[defaultMeeting] = cur_meeting;
            // cur_meetings_data.push(cur_meeting);
        }

        user_database = e.detail.user_database;
        // console.log(user_database);
        chrome.storage.local.set({
            [STR.cur_meetings]: all_cur_meetings,
            [STR.users]: user_database
        });
    });
}
function addPopupListeners(){
    chrome.storage.onChanged.addListener(function (changes) {
        //Just to stay up-to-date with data changes (possibly from other meetings)
        for (var key in changes) {
            var storageChange = changes[key];
            if (key == STR.all_other_meetings) {
                meeting_database = storageChange.newValue;
            } else if (key == STR.all_cur_meetings) {
                all_cur_meetings = storageChange.newValue;
            }
        }
    });
    chrome.runtime.onMessage.addListener( //Recieving end of comms with popup.js
        function (message, _, sendResponse) {
            switch (message.type) {
                case "get_meeting_data":
                    sendResponse({
                        cur_meeting: cur_meeting,
                        user_database: user_database,
                        all_cur_meetings: all_cur_meetings
                    });

                    break;
                case "cur_meeting_update":
                    const event = new CustomEvent('cur_meeting_update', {
                        detail: {
                            meeting_category: message.category
                        }
                    });
                    $("data_transfer")[0].dispatchEvent(event);
                    sendResponse({ ok: ":)" }); //my social life has become talking to various js scripts
                default:
                    break;
            }
        }
    );
}
async function injectScriptsAndStuff() {
    for (let script of injected_scripts) {
        //Makes sure the scripts are loaded in order
        await new Promise((re) => {
            sendScript(script).onload = () => {
                re();

            }
        });
    }
    for (let style of injected_styles) {
        sendScript(style, true);
    }
    //Ready to send data over; script.js cannot access chrome.storage.local
    const event = new CustomEvent('send_data', {
        detail: {
            meeting_data: all_cur_meetings,
            user_database: user_database
        }
    });
    $("data_transfer")[0].dispatchEvent(event);

}
function getFromStorage(key) {
    return new Promise((re) => {
        chrome.storage.local.get(key, function (result) {
            re(result[key]);
        });
    });
}
function setInStorage(key, val) {
    return new Promise((re) => {
        chrome.storage.local.set({ [key]: val }, function () {
            re();
        });
    });
}
function sendScript(name, style = false) {
    let src = chrome.runtime.getURL(name);

    if (style) {
        return $('head').append('<link rel="stylesheet" type="text/css" href="' + src + '">');
    } else {
        var s = document.createElement('script');
        s.src = src;
        document.body.appendChild(s);
        return s;
    }



}
function isExpired(meet) {
    return debug || (new Date() - meet.lastUpdated) / (60000) >= 30;
}

// chrome.storage.local.set({key: value}, function() {
//     console.log('Value is set to ' + value);
//   });
// window.get = (key) => {
//     return new Promise((re) => {
//         chrome.storage.sync.get(key, function (result) {
//             console.log('Value currently is ' + result[key]);
//             re(result[key]);
//         });
//     });
// }
// window.set = (key,val) =>{
//     return new Promise((re) => {
//         chrome.storage.sync.set({ [key]: val }, function () {
//             console.log('Value is set to ' + value);
//             re();
//         });
//     });
// }

// window.addEventListener('storage', function(e) {
//     console.log(e);
// });
