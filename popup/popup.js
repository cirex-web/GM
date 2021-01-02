
window.onload = ()=>{
    setInterval(()=>{
        updateSpeakerData();
    },10);
}
function updateSpeakerData(){
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        chrome.tabs.sendMessage(tabs[0].id, {type: "get_meeting_data"}, function(data) {
            console.log(data);
            if(chrome.runtime.lastError) {
                $("#test").html(chrome.runtime.lastError);
            }else{
                $("#test").html(data.user_data["AOh14Gix2uH3dS4TB39w7t5AcERHMd1kGObMCMvIT3XTVw=s192-c-mo"].speaking_time);
            }
        });
    });
}