// s.setAttribute('data-version', browser.runtime.getManifest().version)
//TODO: Make this cleaner
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

window.addEventListener('storage', function(e) {
    console.log(e);
});