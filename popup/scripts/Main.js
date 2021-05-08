import {MeetingHistory,MeetStorage,Util,AnalysisPage,SpeakingUtil,CurrentMeeting} from "../scripts/internal.js"


let Main = function () {
    let header_names = {
        'C': "Current Meeting",
        "H": "Meeting History",
        "A": "Analysis"
    },
        page = 'C';
    let setUpTabs = function () {
        $(".selected-class").on("click", SpeakingUtil.toggleMeetingDropdown);
        $(".tab-button").click(function (evt) {
            page = $(this).attr("ref");

            Util.createRippleEffect($(this), evt);
            handleTabChange();
            if (page == "A") {
                AnalysisPage.animate();
            } else if (page == 'H') {
                MeetingHistory.animate();
            }
        });
        handleTabChange();
        setUpButtons();
    },
        handleTabChange = function () {

            $(".main-heading-txt").html(header_names[page]);
            $(".tab-container").css("display", "none");
            $(".tab-container[ref=" + page + "]").css("display", "block");
            $(".tab-icon").each((_, tab) => {
                tab.src = tab.src.replace("-active", "");

                if ($(tab).closest("[ref='" + page + "']").length > 0) {
                    tab.src = tab.src.replace(".", "-active.");
                }
            });
            let page_lev = $(".tab-container[ref=" + page + "]").find(".page.active").attr("lev");
            if(parseInt(page_lev)>0){
                Util.showBackArrow();
            }else{
                Util.hideBackArrow();
            }

        },

        setUpButtons = function () {
            $("#no-meetings-notice button").on('click', MeetingHistory.filterMeetings);

            $(".heading-arrow").on('click', () => {
                let $page = $(".tab-container[ref='" + page + "'] .page.active");
                Util.goToPrevPage($page);

            });
        },
        init = function () {
            setUpTabs();
            MeetStorage.init();
            MeetStorage.onStorageUpdate(MeetingHistory.update);
            MeetStorage.onCurrentMeetingUpdate((cur_meeting)=>{
                SpeakingUtil.updateSpeakerData(cur_meeting, $("#speaker-graph"));
            })
            MeetStorage.getAllData(CurrentMeeting.render,()=>{
            
                MeetingHistory.setUp();
                
            });
            Util.getVersion((version) => {
                $("#version").html(version);
            });
        }
    return {
        init: init

    }
}();

export {Main}
