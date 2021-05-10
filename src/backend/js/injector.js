// s.setAttribute('data-version', browser.runtime.getManifest().version)

import { CONSTS } from "../../Config.js"


let STR = {
    cur_meetings: "cur_meetings",
    users: "users",
    all_other_meetings: "other_meetings"
}


let debug = false;
let injected_scripts = ["/external/jquery.js", "/external/arrive.js", "/src/backend/js/injected.js"];
let injected_styles = ["injected.css"];
let all_cur_meetings, user_database, cur_meet, meeting_database;

if (window.location.pathname !== "/") {

    $(window).arrive('[jscontroller="ES310d"]', () => {
        $(window).unbindArrive();
        //Actually in a valid meeting
        let el = document.createElement("data_transfer");
        document.body.appendChild(el);


        let promises = [getFromStorage(STR.cur_meetings), getFromStorage(STR.users), getFromStorage(STR.all_other_meetings)];


        Promise.allSettled(promises).then(async (vals) => {
            //Obtaining meeting information from storage and DOM


            [all_cur_meetings, user_database, meeting_database] = Array.from(vals, val => val.value || {});

            if (!Array.isArray(all_cur_meetings)) {
                all_cur_meetings = [];
            }


            processExpiredMeetings();
            injectScriptsAndStyles().then(()=>{
                console.log("Successfully injected script into DOM!");
            });
            addPopupListeners();

        });

        addScriptListener();
    });

} else {
    console.log("Not in meet");
}

function processExpiredMeetings() {

    let i = all_cur_meetings.length - 1;
    while (i >= 0) {
        if (isExpired(all_cur_meetings[i])) {
            //Removes meet from current meetings list and puts it into long-term storage
            let removed_meet = all_cur_meetings.splice(i, 1)[0];
            meeting_database[removed_meet.category].push(removed_meet);
        }
        i--;
    }
    chrome.storage.local.set({
        [STR.all_other_meetings]: meeting_database,
        [STR.cur_meetings]: all_cur_meetings
    });
}
function addScriptListener() {
    $("data_transfer")[0].addEventListener('merge_cur_meeting', async function (e) {
        cur_meet = e.detail.cur_meet;
        let to_merge = e.detail.to_merge;

        // console.log("meeting data sent over: ", cur_meet);
        let merged = false;
        for (let [i, stored_meet] of all_cur_meetings.entries()) {
            if (stored_meet.meeting_code == cur_meet.meeting_code) {
                if (to_merge) {

                    console.log("Merged meetings",stored_meet,cur_meet);
                    mergeMeetings(stored_meet,cur_meet);
                    sendToScript("cur_meeting_update", { cur_meet: all_cur_meetings[i] }); //should make to_merge toggle false

                } else {
                    if(ableToOverwrite(stored_meet,cur_meet)){
                        console.log("Overwriting",all_cur_meetings[i],"with",cur_meet);
                        all_cur_meetings[i] = cur_meet;
                    }else{
                        console.log("Overwrite intercepted! ",stored_meet,cur_meet);
                        sendToScript("cur_meeting_update", { cur_meet: all_cur_meetings[i] });
                    }
                }
                merged = true;
                break;
            }
        }

        if (!merged) {
            all_cur_meetings.push(cur_meet);
            sendToScript("cur_meeting_update", {cur_meet}); //should make to_merge toggle false
            console.log("Successfully initialized new meeting",cur_meet);

        }

        user_database = e.detail.user_database;
        // console.log(user_database);
        chrome.storage.local.set({
            [STR.cur_meetings]: all_cur_meetings,
            [STR.users]: user_database
        });
    });
}
function ableToOverwrite(stored_meet, cur_meet){
    let stored_users = stored_meet.user_data;
    let cur_users = cur_meet.user_data;
    if(Object.values(stored_users).length>Object.values(cur_users).length)return false;
    for(let [id,data] of Object.entries(stored_users)){
        if(!cur_users[id]||cur_users[id].speaking_time<data.speaking_time){
            return false;
        }
    }
    return true;
}
function mergeMeetings(stored_meet, cur_meet) {
    stored_meet.lastUpdated = Math.max(stored_meet.lastUpdated, cur_meet.lastUpdated);
    stored_meet.teacher_IDs = [...new Set(stored_meet.teacher_IDs.concat(cur_meet.teacher_IDs))];
    if(stored_meet.category===CONSTS.UNCAT){

        stored_meet.category = cur_meet.category;
    }
    for (let [id, stats] of Object.entries(cur_meet.user_data)) {
        let total_speaking_time = stats.speaking_time;
        if (stored_meet.user_data[id]) {
            total_speaking_time += stored_meet.user_data[id].speaking_time;
        }
        stored_meet.user_data[id] = stats;
        stored_meet.user_data[id].speaking_time = total_speaking_time;
    }
}
function sendToScript(name, data) {
    try {
        // console.log("sending data", data);
        const event = new CustomEvent(name, {
            detail: data
        });
        $("data_transfer")[0].dispatchEvent(event);
    } catch (e) {
        console.log(e);
    }

}
function addPopupListeners() {
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
                        cur_meet,
                        user_database,
                        all_cur_meetings
                    });
                    break;
                case "cur_meeting_update":{
                    const event = new CustomEvent('cur_meeting_category_update', {
                        detail: {
                            meeting_category: message.category
                        }
                    });
                    $("data_transfer")[0].dispatchEvent(event);
                    sendResponse("Category update sent!"); //my social life has amounted to talking to various js scripts
                    break;
                }
                    
                default:
                    console.log("popup has sent the invalid message: ", message);
                    break;
            }
        }
    );
}



async function injectScriptsAndStyles() {
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

    sendToScript('send_data', { user_database });
}
function getFromStorage(key) {
    return new Promise((re) => {
        chrome.storage.local.get(key, function (result) {
            re(result[key]);
        });
    });
}
// function setInStorage(key, val) {
//     return new Promise((re) => {
//         chrome.storage.local.set({ [key]: val }, function () {
//             re();
//         });
//     });
// }
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
