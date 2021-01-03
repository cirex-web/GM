let STR = {
    cur_meeting: "cur_meeting",
    users: "users"
} //TODO: delete afterwards
//TODO: deal with page refresh... should refresh data or something
let user_database, cur_meeting, meet_code;
window.onload = () => {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        chrome.tabs.sendMessage(tabs[0].id, { type: "get_meeting_data" }, function (data) {
            user_database = data.user_database;
            cur_meeting = data.cur_meeting;
            console.log(data);
            if (chrome.runtime.lastError) {
                $("#test").html(chrome.runtime.lastError);

            }else if(!user_database||!cur_meeting){
                $("#test").html("No data yet!");
            }else{
                meet_code = cur_meeting.meeting_code;

                updateSpeakerData();
            }
        });
    });
}
function updateSpeakerData() {
    console.log(cur_meeting);
    $("#test").html(cur_meeting.user_data["AOh14Gix2uH3dS4TB39w7t5AcERHMd1kGObMCMvIT3XTVw=s192-c-mo"].speaking_time);
    
}
chrome.storage.onChanged.addListener(function (changes, namespace) {
    console.log("changed!!");
    for (var key in changes) {
        var change = changes[key];
        console.log(change.newValue);
        if (key === STR.cur_meetings) {

            for(let meet of change.newValue){
                if(meet.meeting_code==meet_code){
                    cur_meeting = meet;
                    break;
                }
            }
            updateSpeakerData();
        } else if (key === STR.users) {
            user_database = changes.newValue;
        }
        //   console.log('Storage key "%s" in namespace "%s" changed. ' +
        //               'Old value was "%s", new value is "%s".',
        //               key,
        //               namespace,
        //               storageChange.oldValue,
        //               storageChange.newValue);
        // }
    }
});