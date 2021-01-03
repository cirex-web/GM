// s.setAttribute('data-version', browser.runtime.getManifest().version)
//TODO: Make this cleaner

let STR = {
    cur_meetings: "cur_meetings",
    users: "users"
}

if (window.location.pathname !== "/") {

    let el = document.createElement("data_transfer");
    document.body.appendChild(el);

    let meeting_data, user_database, cur_meeting;

    let promises = [getFromStorage(STR.cur_meetings), getFromStorage(STR.users)];


    Promise.allSettled(promises).then((vals) => {
        meeting_data = vals[0].value || [];
        meeting_data.push({
            lastUpdated: + new Date(),
            meeting_code: undefined, //TODO: set this to meeting URL ending
            user_data: {}
        });
        //TODO: If it's an array, filter out all the meetings that are expired
        user_database = vals[1].value || {};

        sendScript("/external/jquery.js").onload = () => {
            sendScript("/external/arrive.js").onload = () => {
                sendScript("script.js").onload = () => {
                    console.log("sending data");
                    const event = new CustomEvent('data', {
                        detail: {
                            meeting_data: meeting_data,
                            user_database: user_database
                        }
                    });
                    $("data_transfer")[0].dispatchEvent(event);
                }
            }
        }
        chrome.runtime.onMessage.addListener(
            function (message, _, sendResponse) {
                switch (message.type) {
                    case "get_meeting_data":
                        sendResponse({
                            cur_meeting: cur_meeting,
                            user_database: user_database

                        });
                        // console.log("sending",cur_meeting,user_database);
                        break;
                    default:
                        break;
                }
            }
        );
    });

    $("data_transfer")[0].addEventListener('terry_time', function (e) {
        cur_meeting = e.detail.meeting_data;
        if (meeting_data[0].meeting_code == undefined) {
            meeting_data[0] = cur_meeting;
        } else {
            let merged = false

            for (let [i, meet] of meeting_data.entries()) {
                if (meet.meeting_code == cur_meeting.meeting_code) {
                    meeting_data[i] = cur_meeting;
                    merged = true;
                    break;
                }
            }

            if (!merged) {
                meeting_data.push(cur_meeting);
            }
        }

        user_database = e.detail.user_database;

        setInStorage(STR.cur_meetings, meeting_data);
        setInStorage(STR.users, user_database);
        
    });


} else {
    console.log("Not in meet");
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
            console.log("set", key);
            re(); 
        });
    });
}
function sendScript(name, external = false) {
    var s = document.createElement('script');
    if (external) {
        s.src = name;
    } else {
        s.src = chrome.runtime.getURL(name);

    }
    console.log(s.src);
    document.body.appendChild(s);

    return s;
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
