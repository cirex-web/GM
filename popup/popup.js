let STR = {
    cur_meetings: "cur_meetings",
    users: "users"
}
//TODO: deal with page refresh... should refresh data or something


let user_database, cur_meeting, meet_code; //these are the variables that contain the current meeting data (they're updated automatically and updateSpeakerData() is called everytime there's an update.)
/*
//user_database contains every seen user
key: image ID, (Generated at time of first appearance)
value: {
    IMG_ID: current pfp URL (may or may not be identical to key. Multiple users may have the same IMG_ID attribute, which means that they're the same person)

    NAME: user name
    TIME_CREATED: time when first seen on google meet (not relevant here) 
}

Example:

key: AOh14Gix2uH3dS4TB39w7t5AcERHMd1kGObMCMvIT3XTVw=s192-c-mo, 
value: {
    IMG_ID: "AOh14Gix2uH3dS4TB39w7t5AcERHMd1kGObMCMvIT3XTVw=s192-c-mo"
    NAME: "Eric Xu"
    TIME_CREATED: 1609695853290 
}

*/
/*
cur_meeting represents the current meeting obj

category: "UNCATEGORIZED" 
lastUpdated: 1609697134416 
meeting_code: "kmr-bymc-avr"
    user_data:
        Key value pairs (see below)    


One user entry in user data
Key: image ID
Value:{
    before_time: Not relevant
    cur_interval: Not relevant
    is_speaking: Not relevant
    speaking_time: yes  
}

Good luck! :)
*/
window.onload = () => {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        chrome.tabs.sendMessage(tabs[0].id, { type: "get_meeting_data" }, function (data) {

            if (chrome.runtime.lastError) {
                $("#test").html("You aren't in a call yet!");

            } else {
                user_database = data.user_database;
                cur_meeting = data.cur_meeting;
                console.log(data);
                if (!user_database || !cur_meeting) {
                    $("#test").html("No data yet!");
                } else {
                    meet_code = cur_meeting.meeting_code;

                    updateSpeakerData();
                }
            };
        })
    });

    let page = $(".tab")[0].innerHTML;

    $(".tab").on( "mouseover",function (){
        $(this).addClass("selected");
    });
    $(".tab").on( "mouseout",function (){
        if(page!=$(this).html()){
            $(this).removeClass("selected");
        }
    });
    $(".tab").click(function(){
        $(".tab").removeClass("selected");
        $(this).addClass("selected");
        page = $(this).html();
        
    })
}
function updateSpeakerData() {
    $("#test").html(cur_meeting.user_data["AOh14Gix2uH3dS4TB39w7t5AcERHMd1kGObMCMvIT3XTVw=s192-c-mo"].speaking_time);
}
chrome.storage.onChanged.addListener(function (changes) {
    for (var key in changes) {
        var change = changes[key];
        if (key === STR.cur_meetings) {

            for (let meet of change.newValue) {
                if (meet.meeting_code == meet_code) {
                    cur_meeting = meet;
                    break;
                }
            }
            updateSpeakerData();
        } else if (key === STR.users) {
            user_database = changes.newValue;
        }

    }
});
