import { Logger, CONFIG, CONSTS } from "./internal.js"

let MeetStorage = function () {
    let user_database, cur_meet, meeting_database,
        all_cur_meetings, meetings_per_user,
        sorted_meetings,
        STR = {
            cur_meetings: "cur_meetings",
            users: "users",
            all_other_meetings: "other_meetings",
            all_cur_meetings: "cur_meetings"
        },
        storageUpdateCallback,
        curMeetingUpdateCallback;


    //SETTERS
    let
        addCategory = function (cat) {
            if (cat.replaceAll(" ", "") != "" && !meeting_database[cat]) {
                meeting_database[cat] = [];
                updateStorage();
                return true;
            } else {
                return false;
            }
        },
        removeCategory = function (cat) {
            if (meeting_database[cat]) {
                for (let i = 0; i < meeting_database[cat].length; i++) {
                    meeting_database[cat][i].category = CONSTS.UNCAT;
                    meeting_database[CONSTS.UNCAT].push(meeting_database[cat][i]);
                }
                delete meeting_database[cat];
                updateStorage();

            }
        },
        removeMeeting = function (id) {
            Logger.verbose("Removing meeting with id " + id);
            let cat = sorted_meetings[id].category;
            meeting_database[cat] = meeting_database[cat].filter(item => item != sorted_meetings[id]);
            sorted_meetings[id] = null;
            updateStorage();
        },
        moveMeeting = function (moved_meeting, original_category, new_category) {
            Logger.verbose("Moving meeting from "+original_category+" to "+new_category);
            meeting_database[original_category] = meeting_database[original_category].filter(item => item != moved_meeting);
            moved_meeting.category = new_category;
            meeting_database[new_category].push(moved_meeting);
            updateStorage();
        },
        setCurMeetCategory = function (chosen_category) {
            cur_meet.category = chosen_category;
            chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
                chrome.tabs.sendMessage(tabs[0].id, { type: "cur_meeting_update", category: chosen_category });
            });
            updateStorage();
        },



        //GETTERS
        getFromStorage = function (key) {
            return new Promise((re) => {
                chrome.storage.local.get(key, function (result) {
                    re(result[key]);
                });
            });
        },
        getAllData = async function (currentMeetingCallback, meetingHistoryCallback) {

            getCurrentMeetingData(currentMeetingCallback);

            meeting_database = await getFromStorage(STR.all_other_meetings);
            user_database = await getFromStorage(STR.users);
            all_cur_meetings = await getFromStorage(STR.all_cur_meetings);

            meeting_database = meeting_database || {};
            user_database = user_database || {};
            all_cur_meetings = all_cur_meetings || {};

            Logger.info("meeting_database",meeting_database);
            Logger.info("user_database",user_database);
            Logger.info("all_cur_meetings",all_cur_meetings);


            meetings_per_user = getMeetingsPerUser(user_database, meeting_database);
            if (Object.keys(meeting_database).length > 0) {
                cleanDatabase();
                meetingHistoryCallback();
            }
        },
        getSortedMeetings = function (generate_new_copy = false) {
            if (generate_new_copy) {
                sorted_meetings = [];
                for (let cat of Object.keys(meeting_database)) {
                    for (let meeting of meeting_database[cat]) {
                        sorted_meetings.push(meeting);
                    }
                }
                for (let meeting of all_cur_meetings) {
                    sorted_meetings.push($.extend(meeting, {
                        cur: true
                    }));
                }
                sorted_meetings.sort((a, b) => b.lastUpdated - a.lastUpdated);
            }
            return sorted_meetings;
        },
        getCurrentMeetingData = function (render) {
            chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
                chrome.tabs.sendMessage(tabs[0].id, { type: "get_meeting_data" }, async function (data) {

                    if (chrome.runtime.lastError) {
                        render("You aren't in a call yet!");
                    } else {
                        user_database = data.user_database; //TODO: Why is user_database passed in here
                        cur_meet = data.cur_meet;
                        if (!cur_meet) {
                            render("No data yet!");
                        } else {
                            render();
                        }
                    }


                })
            });
        },
        getMeetingsPerUser = function (user_database, meeting_database) {
            let res = [];
            for (let user of Object.values(user_database)) {
                let id = user.IMG_ID;

                if (!res[id]) {
                    res[id] = {
                        URL: user.IMG_ID,
                        NAME: user.NAME,
                        meetings: []
                    }
                }

            }
            for (let meetings of Object.values(meeting_database)) {
                for (let meeting of meetings) {
                    for (let id1 of Object.keys(meeting.user_data)) {
                        let id = user_database[id1].IMG_ID;

                        res[id].meetings.push(meeting);
                    }
                }
            }
            return res;
        },

        //CALLBACKS
        onStorageUpdate = function (func) {
            storageUpdateCallback = func;
        },
        onCurrentMeetingUpdate = function (func) {
            curMeetingUpdateCallback = func;
        },


        //INTERAL
        init = function () {
            chrome.storage.onChanged.addListener(processStorageChanges);
        },
        processStorageChanges = function (changes) {
            let cur_meet_update = false;
            for (let key in changes) {
                let change_obj = changes[key]
                let cur_change = change_obj.newValue;
                if (key === STR.cur_meetings) {
                    updateCurMeetingData(cur_change);
                    cur_meet_update = true;
                } else if (key === STR.users) {
                    user_database = cur_change;
                    Logger.verbose("updated user_database to ", user_database);
                    cur_meet_update = true;

                }
            }
            if (cur_meet_update && cur_meet) {
                $("[ref='C'] .full-disp").css('display', 'none');
                curMeetingUpdateCallback(cur_meet);
            }
        },
        cleanDatabase = function () {
            //TODO: Also merge any users who have changed pfp
            for (let [key] of Object.entries(meeting_database)) {
                for (let i = 0; i < meeting_database[key].length; i++) {
                    meeting_database[key][i].category = key;
                }
            }
        },
        updateStorage = function () {
            // console.log("updating meeting storage");
            if (!CONFIG.DEBUG) {
                chrome.storage.local.set({ [STR.all_other_meetings]: meeting_database });

            }
            storageUpdateCallback();
        },
        updateCurMeetingData = function (change) {
            Logger.info("Updating current meeting data; hopefully cur_meeting is not undefined");//TODO: It is undefined when extension stays open from before joining meet
            for (let meet of change) {
                if (meet.meeting_code == cur_meet.meeting_code) {
                    cur_meet = meet;
                    break;
                }
            }


        }

    return {
        init,
        updateMeetingStorage: updateStorage,
        removeCategory,
        removeMeeting,
        moveMeeting,
        addCategory,
        getAllData,
        setCurMeetCategory,
        onStorageUpdate,
        onCurrentMeetingUpdate,
        getSortedMeetings,

        //MORE GETTERS
        getUserDatabase: () => user_database,
        getCurMeeting: () => cur_meet,
        getMeetingDatabase: () => meeting_database,
        getAllCurMeetings: () => all_cur_meetings,
        getMeetingsPerUser: () => meetings_per_user
    }
}();
export { MeetStorage }
// module.exports.MeetStorage = MeetStorage;