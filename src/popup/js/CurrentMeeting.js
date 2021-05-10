import {SpeakingUtil,MeetStorage} from "./internal.js"

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
            $(".selected-class p").html(MeetStorage.getCurMeeting().category);

            SpeakingUtil.updateSpeakerData(MeetStorage.getCurMeeting(), $("#speaker-graph"), undefined, user_data);
        }
    }
    return {
        render: render
    }
}();

export {CurrentMeeting}

