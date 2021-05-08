import {MeetingHistory,MeetStorage,Util,CONFIG} from "../scripts/internal.js"


let AnalysisPage = function () {
    let seen_analysis = false;
    let catsAr = [],
        usersAr = [],
        users = {},
        TEXT = {
            user_leaderboard: "Most active participants",
            class_leaderboard: "Most active classes"
        }
    let animate = () => {
        //Conditions
        // && !seen_analysis && meeting_database && Object.keys(meeting_database).length > 0
        if (!seen_analysis && MeetingHistory.get_sorted_meetings().length > 5) {
            seen_analysis = true;

            let meeting_database = MeetStorage.get_meeting_database();
            let user_database = MeetStorage.get_user_database();
            for (let [name, cat] of Object.entries(meeting_database)) {
                let total_time = 0;
                for (let meeting of cat) {
                    for (let [id, person] of Object.entries(meeting.user_data)) {
                        let time = person.speaking_time;
                        total_time += time;
                        let URL = user_database[id].IMG_ID;
                        let name = user_database[id].NAME;

                        if (!users[URL]) {
                            users[URL] = {
                                total_speaking_time: time,
                                num: 1,
                                name: name,
                                URL: URL
                            }
                            usersAr.push(users[URL]);
                        } else {
                            users[URL].total_speaking_time += time;
                            users[URL].num++;
                        }


                    }
                }
                let avg = cat.length == 0 ? 0 : total_time / cat.length;
                catsAr.push({
                    avg_time: Util.msToMin(avg),
                    name: name
                });

            }
            catsAr.sort((a, b) => b.avg_time - a.avg_time);
            usersAr.sort((a, b) => {
                if (!a.avg) {
                    a.avg = Util.msToMin(a.total_speaking_time / a.num);
                }
                if (!b.avg) {
                    b.avg = Util.msToMin(b.total_speaking_time / b.num);
                }
                return b.avg - a.avg;
            });
            // console.log(usersAr,catsAr);
            catsAr.par1 = "name";
            catsAr.par2 = "avg_time";
            usersAr.par1 = "name";
            usersAr.par2 = "avg";
            usersAr.par3 = "URL";
            catsAr.title = TEXT.class_leaderboard;
            usersAr.title = TEXT.user_leaderboard;
            //TODO: lol how do I condense this
            $("[ref='A'] .full-disp").css('display', 'none');

            createRows($("#active-participants"), usersAr, 0, 3);
            createRows($("#active-classes"), catsAr, 0, 3);
            setUpMainInteractivity($(".tab-container[ref=A]"));
            
        }
    },
        setUpMainInteractivity = function ($win) {
            $("[ref='A'] a").on('click', async (ev) => {
                let $win = $(".tab-container[ref='A']");
                let $target = $(ev.target);
                if ($target.attr("ref-type") == "leaderboard") {
                    let $page = (await Util.createFullPage("t-leaderboard.html", $win)).contents();

                    if ($target.attr("ref-id") == "user") {

                        // console.log($target);

                        createLeaderboardPage($page.find(".leaderboard"), usersAr);
                    } else if ($target.attr("ref-id") == "classes") {
                        createLeaderboardPage($page.find(".leaderboard"), catsAr);

                    }

                }
            });
            setUpFrameInteractivity($win);
        },
        setUpFrameInteractivity = function($win){
            $win.on('click','.data-row.clickable',function(){
                let $par_win;
                if($(this).closest(".tab-container").length>0){
                    $par_win = $(this).closest(".tab-container");
                }else{
                    $par_win = $("html").find(".tab-container[ref="+$win.attr("ref")+"]");
                }
                console.log($par_win);
                Util.createFullPage("t-user.html",$par_win);
            });
        },
        createLeaderboardPage = function ($leaderboard, data) {
            let $input = $leaderboard.find("input.page-input");
            setUpFrameInteractivity($leaderboard.closest("html")); //TODO: Not working
            $input.change(function () {
                updateLeaderboard($leaderboard, $input, data);
            });
            $leaderboard.find(".max-items-selector button").on('click', function () {
                let $button = $(this);
                $leaderboard.find("button").removeClass("selected");
                $button.addClass("selected");
                CONFIG.SETTINGS.MAX_PER_PAGE = parseInt($button.attr("val"));
                updateLeaderboard($leaderboard, $input, data);
            });
            $leaderboard.find(".row-icon").on('click', function () {
                let $arrow = $(this);
                let pg = parseInt($input.val());
                if ($arrow.hasClass("left-arrow")) {
                    $input.val(pg - 1);
                } else {
                    $input.val(pg + 1);
                }
                updateLeaderboard($leaderboard, $input, data);
            });

            let $active_button = $leaderboard.find("button[val=" + CONFIG.SETTINGS.MAX_PER_PAGE + "]");
            if ($active_button.length == 0) {
                CONFIG.SETTINGS.MAX_PER_PAGE = 10;
                $active_button = $leaderboard.find("button[val=" + CONFIG.SETTINGS.MAX_PER_PAGE + "]");
            }
            $active_button.addClass("selected");
            $leaderboard.find(".filter-button").on('click', function () {
                $(this).parent().toggleClass("clicked");
            });
            $leaderboard.find("input.page-input").val(1).change();
            // updateLeaderboard($leaderboard,1)
            // $leaderboard.find("input.page-input")[0].prev_val = 1;

        },
        updateLeaderboard = function ($leaderboard, $input, data) {
            let max_per_page = CONFIG.SETTINGS.MAX_PER_PAGE == -1 ? data.length : CONFIG.SETTINGS.MAX_PER_PAGE;

            let max_pages = Math.floor(data.length / max_per_page) + 1;
            if (data.length % max_per_page == 0) max_pages--;
            let page_num = $input.val();
            $leaderboard.find(".max-pages").html(max_pages);
            if (!isNaN(page_num) && page_num >= 1) {
                $input.val(page_num);
                if (page_num > max_pages) {
                    $input.val(max_pages);
                    page_num = max_pages;
                }
                $input[0].prev_val = page_num;
                $leaderboard.find(".row-icon").removeClass("disabled");
                if (page_num == 1) {
                    $leaderboard.find(".left-arrow").addClass("disabled");
                }
                if (page_num == max_pages) {
                    $leaderboard.find(".right-arrow").addClass("disabled");
                }
                createRows($leaderboard, data, max_per_page * (page_num - 1), max_per_page);
            } else {
                $input.val($input[0].prev_val);
            }
        },
        createRows = function ($table, data, start, num) {
            let namePar = data.par1;
            let valPar = data.par2;
            let url = data.par3;
            let title = data.title;
            $table.find(".heading-txt").html(title);
            let $cont = $table.find(".row-container");
            $cont.html("");

            let maxNum = Math.min(start + num, data.length);
            let n = Util.getLength(maxNum);
            for (let i = start; i < start + num && i < data.length; i++) {
                let key = data[i][namePar];
                let val = data[i][valPar];
                let img = data[i][url];
                let $clone = $($("#data-row")[0].content.cloneNode(true));
                $clone.find(".data-row-key").html(key);
                $clone.find(".data-row-val").html(val);
                $clone.attr("index",i);
                $clone.find(".data-row-rank").html("#" + (i + 1)).css("width", (n + 1) + "ch");
                if (img) {
                    $clone.find(".data-row-img").removeClass("none").attr("src", img);
                }
                $cont.append($clone);
            }
            // console.log(data);
        }
    return {
        animate: animate
    }
}();
export {AnalysisPage}
// module.exports.AnalysisPage = AnalysisPage;