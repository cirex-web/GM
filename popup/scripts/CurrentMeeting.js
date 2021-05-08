import {SpeakingUtil,MeetStorage} from "../scripts/internal.js"

// const MeetStorage = require("../scripts/MeetStorage");
// const SpeakingUtil = require("../scripts/SpeakingUtil");

let CurrentMeeting = function () {
    let user_data = [];
    let render = function (str) {
        if (str) {
            $("[ref='C'] .full-disp").css('display', 'flex');
            $("[ref='C'] .full-disp").html(str);
        } else {

            $("[ref='C'] .full-disp").css('display', 'none');
            $(".selected-class p").html(MeetStorage.get_cur_meeting().category);

            SpeakingUtil.updateSpeakerData(MeetStorage.get_cur_meeting(), $("#speaker-graph"), undefined, user_data);
        }
    }
    return {
        render: render
    }
}();

export {CurrentMeeting}

