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