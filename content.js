// s.setAttribute('data-version', browser.runtime.getManifest().version)
//TODO: Make this cleaner

let el = document.createElement("data_transfer");
let cur_meeting_data = {};
let users = [];
document.body.appendChild(el);

sendScript("/external/jquery.js").onload=()=>{
    sendScript("/external/arrive.js").onload = ()=>{
        sendScript("script.js");
    }
}

function sendScript(name, external = false){
    var s = document.createElement('script');
    if(external){
        s.src = name;
    }else{
        s.src = chrome.runtime.getURL(name);

    }
    console.log(s.src);
    document.body.appendChild(s);

    return s;
}
$("data_transfer")[0].addEventListener('terry_time', function (e) {
    cur_meeting_data = e.detail.meeting;
    users = e.detail.users;
});
chrome.runtime.onMessage.addListener(
    function(message, _, sendResponse) {
        switch(message.type) {
            case "get_meeting_data":
                sendResponse({
                    meeting:cur_meeting_data,
                    users: users//ALL
                
                });
                console.log("popup asked for data");
                break;
            default:
                break;
        }
    }
);

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
