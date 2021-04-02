"use strict"

let debug = false;
let consts = {
    UNCAT: "UNCATEGORIZED",

}
let SETTINGS = {
    max_per_page: 10
}

// const fac = new FastAverageColor();
// const arCol = (arr, n) => arr.map(x => x[n]);

window.onload = () => Main.init();
let Util = function () {
    let createPieChart = function (data, id, template) {
        let options = JSON.parse(JSON.stringify(template));
        options.series[0].data = data;
        return Highcharts.chart(id, options);
    },
        // createChart = function (x, y, label_name, container, template) {

        //     let options = $.extend({}, template, {
        //         series: [{
        //             name: label_name,
        //             data: y
        //         }],


        //     });
        //     if (x) {
        //         $.extend(options, {
        //             xaxis: {
        //                 categories: x
        //             }
        //         });
        //     }
        //     var chart = new ApexCharts(container, options);

        //     chart.render();
        // },
        generateDate = function (mm) {
            return new Date(mm).toLocaleDateString();
        },
        generateFullDate = function (mm) {
            let date = new Date(mm);
            return date.toLocaleString("en-US", { timeZoneName: "short" });
        },
        msToString = function (ms) {
            let seconds = parseInt(ms / 1000);
            let minutes = parseInt(seconds / 60);
            let hours = parseInt(minutes / 60);
            minutes %= 60;
            seconds %= 60;

            minutes = ("00" + minutes).slice(-2);
            seconds = ("00" + seconds).slice(-2);

            if (hours == 0) {
                return "Speaking time: " + minutes + ":" + seconds;
            } else {
                return "Speaking time: " + hours + ":" + minutes + ":" + seconds;
            }
        },
        getVersion = function (callback) {
            var xmlhttp = new XMLHttpRequest();
            xmlhttp.open('GET', '../manifest.json');
            xmlhttp.onload = function () {
                var manifest = JSON.parse(xmlhttp.responseText);
                callback(manifest.version);
            }
            xmlhttp.send(null);
        },
        msToMin = function (ms) {
            return Math.round(ms / 60 / 100) / 10;
        },
        createFullPage = function (url, $win) {
            return new Promise((re) => {
                let frame = document.createElement("iframe");
                frame.setAttribute("src", url);
                frame.classList.add("full-page");
                frame.classList.add("hidden"); //Otherwise the page is visible for a split second before the css loads

                $(frame).appendTo($win).on('load', (ev) => {
                    // console.log(ev.currentTarget);

                    let $frame = $(ev.currentTarget);

                    if ($frame.closest(".page").length > 0) {
                        let $script = $(createCSSLink("style.css"));
                        $script[0].onload = function () {
                            transitionToNewPage($frame).then(() => re($frame));
                        };

                        $script.appendTo($frame.contents().find("head"));
                    } else {

                        let div = document.createElement("div");
                        div.classList.add("page");
                        $frame.wrap(div);
                    }

                });
            });



        },
        transitionToNewPage = function ($frame) {
            return new Promise((re) => {
                let prev_page = $frame.parent().parent().find(".page.active");
                let lev = parseInt(prev_page.attr("lev"));
                prev_page.removeClass("active").addClass("below");
                $frame.removeClass("hidden");
                $frame.closest(".page").addClass("active").attr("lev", lev + 1);
                showBackArrow();
                re($frame);
            });

        },
        goToPrevPage = function ($page) {
            let lev = parseInt($page.attr("lev")) - 1;
            console.log($page);
            if (lev >= 0) {

                let $prev_page = $page.parent().find(".page[lev=" + lev + "]");
                $page.removeClass("active");
                setTimeout(() => {
                    $page.remove();
                }, 1000);
                $prev_page.removeClass("below").addClass("active");

            }
            if (lev <= 0) {
                hideBackArrow();
            }
        },
        hideBackArrow = function () {
            $(".heading-arrow").addClass("hidden");
        },
        showBackArrow = function () {
            $(".heading-arrow").removeClass("hidden");
        },
        createCSSLink = function (url) {
            let link = document.createElement("link");
            link.href = url;
            link.rel = "stylesheet";
            link.type = "text/css";
            return link;
        },
        createRippleEffect = function ($button, evt) {
            console.log($button);
            let btn = $(evt.currentTarget);
            let x = evt.pageX - btn.offset().left;
            let y = evt.pageY - btn.offset().top;

            let ripple = $(`<span class="ripple"></span>`).appendTo($button).css({
                left: x,
                top: y
            });
            setTimeout(() => {
                ripple.remove();
            }, 500);
        },
        getLength = function (n) {
            return n.toString().length;
        }
    return {
        createPieChart: createPieChart,
        getVersion: getVersion,
        generateDate: generateDate,
        generateFullDate: generateFullDate,
        msToString: msToString,
        msToMin: msToMin,
        createFullPage: createFullPage,
        getLength: getLength,
        goToPrevPage: goToPrevPage,
        showBackArrow: showBackArrow,
        hideBackArrow: hideBackArrow,
        createRippleEffect, createRippleEffect
    }
}();
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
            Util.getVersion((version) => {
                $("#version").html(version);
            });
        }
    return {
        init: init

    }
}();

let MeetingHistory = function () {
    let meta = {
        meetings_pie: undefined,
        filter: undefined,
        meetings_pie_data: [],
        meeting_cats: [],
        rendered: false,
        seen: false //For the animations
    },
        templates = {
            history_meetings_pie: {
                chart: {
                    plotBackgroundColor: null,
                    plotBorderWidth: null,
                    plotShadow: false,
                    type: 'pie',
                    height: 150,
                    width: 160,
                    margin: 0
                },

                credits: {
                    enabled: false
                },
                title: {
                    text: ''
                },

                plotOptions: {
                    pie: {
                        allowPointSelect: true,
                        cursor: 'pointer',
                        dataLabels: {
                            enabled: false
                        },
                        showInLegend: false
                    }
                },
                series: [{
                    colorByPoint: true
                }]
            }
        },
        sorted_meetings = [];
    let updateCategoryFrequency = function () {
        let cats = meta.meeting_cats;
        let freq = Array.from({ length: cats.length }, () => 0);


        for (let i = 0; i < sorted_meetings.length; i++) {
            if (!sorted_meetings[i]) continue;
            let cat = sorted_meetings[i].category;
            if (!cats.includes(cat)) {
                cats.push(cat);
                freq.push(0);
            }
            freq[cats.indexOf(cat)]++;

        }
        meta.meetings_pie_data = [];
        for (let i = 0; i < freq.length; i++) {
            meta.meetings_pie_data.push({
                name: cats[i],
                y: freq[i]
            });
        }
        meta.meetings_pie_data.sort((a, b) => -a.y + b.y);

    },
        setUpMeetingsPage = function () {
            let meeting_database = MeetStorage.get_meeting_database();
            $("[ref='H'] .full-disp").css('display', 'none');
            console.info("[GM] setting up meetings page");
            let all_cur_meetings = MeetStorage.get_all_cur_meetings();
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


            updateCategoryFrequency();

            meta.meetings_pie = Util.createPieChart(meta.meetings_pie_data, "meeting-cats", templates.history_meetings_pie);
            $("#meeting-cats").on('click', filterMeetings);


            let date = "";
            for (let [i, meeting] of sorted_meetings.entries()) {
                let newDate = Util.generateDate(meeting.start_time || meeting.lastUpdated);
                if (date != newDate) {
                    date = newDate;
                    createMeetingDivider(date);
                }
                createMeetingEl(meeting, i);

            }
            $(".meeting-top").on('click mouseover mouseleave', function (ev) {

                //TODO: Refactor
                let $target = $(ev.target);
                let inside_dropdown = $target.closest(".drop-menu").length > 0;
                if ($target.hasClass('meeting-page-trash')) {
                    return;
                }
                if (ev.type == "mouseover") {
                    if (!inside_dropdown) {
                        $target.closest(".element-container").addClass('hovered');
                    }

                } else if (ev.type == "mouseleave") {
                    $target.closest(".element-container").removeClass('hovered');
                } else {
                    let $element_container = $(this).closest('.element-container');
                    let $bottom = $element_container.find(".meeting-data");
                    let $drop_menu = $target.closest(".drop-menu");

                    let $class_selector = $(ev.target).closest(".class-selector");//changed from inside thing
                    if ($class_selector.length > 0 && $element_container.hasClass("clicked") && !$(ev.target).closest(".element-container").hasClass('live')) {
                        //first part checks if user has clicked inside of class_selector
                        //Only allows class selector dropdown to open if panel has been opened. (and it's not a 'live' panel)
                        if ($drop_menu.length == 0) {
                            // console.log($(this));
                            SpeakingUtil.toggleMeetingDropdown($class_selector);

                        }



                    } else { //user clicked outside of class_selector

                        $class_selector = $element_container.find(".class-selector");
                        if (!$class_selector.hasClass('clicked')) { //Prevents main content from closing if class dropdown is open

                            $element_container.toggleClass("clicked");
                            if ($element_container.hasClass("clicked")) {
                                let $graph = $bottom.find(".graph-container");
                                // console.log(sorted_meetings[parseInt(graph.attr('id'))]);
                                SpeakingUtil.updateSpeakerData(sorted_meetings[parseInt($element_container.attr('id'))], $graph, 10, true);

                            }
                        }

                    }
                }

            });
            $(".meeting-page-trash").on('click', function () {
                let $container = $(this).closest(".element-container");
                let id = parseInt($container.attr("id"));
                let cat = sorted_meetings[id].category;
                meeting_database[cat] = meeting_database[cat].filter(item => item != sorted_meetings[id]);
                sorted_meetings[id] = null;
                $container.addClass("removed");
                MeetStorage.updateMeetingStorage();
                setTimeout(() => {
                    $container.remove();

                }, 200);
            });
            $(".class-selector").on('mouseover mouseleave', function (ev) {
                let $this = $(this);
                if (ev.type == "mouseover" && ($this.hasClass('main') || $this.closest(".element-container").hasClass("clicked"))) {
                    if (!$(ev.target).closest(".element-container").hasClass('live')) {
                        $this.addClass("hovered");

                    }
                } else {
                    if (!$this.find(".drop-menu").hasClass('hovered')) {
                        $this.removeClass("hovered");

                    }
                }

            });
            tippy('.meeting-page-question', {
                content: "This meeting is ongoing and has not yet been moved to permanent storage."
            })
        },
        createMeetingDivider = function (date) {
            let $clone = $($("#meeting-date-divider")[0].content.cloneNode(true));
            $clone.find(".date").html(date);
            $("#meetings-container").append($clone);
        },
        createMeetingEl = function (meeting, i) {
            let clone = $("#meeting-data")[0].content.cloneNode(true);
            let $clone = $(clone);
            if (meeting.cur) {
                $clone.find(".element-container").addClass("live");
            }
            $clone.find(".meeting-top .class-name").html(meeting.category);
            $clone.find(".date").html(Util.generateFullDate(meeting.lastUpdated));
            $clone.find(".code").html(meeting.meeting_code);
            $clone.find(".element-container").attr('id', i);
            // $clone.find(".selected-class").on('click',);
            $("#meetings-container").append($clone);
        },
        filterMeetings = function () {


            let cats = meta.meetings_pie.getSelectedPoints();
            if (cats[0]) {
                let cat = cats[0].name;
                if (meta.filter != cat) {
                    meta.filter = cat;
                    filterMeetingsHelper(cat);
                    $(".date-divider").css("display", "none");
                }
            } else {
                meta.filter = undefined;
                filterMeetingsHelper(undefined);
                $(".date-divider").css("display", "block");
            }
            if (meta.filter) {
                $(".cur-filter").html(meta.filter);

            } else {
                $(".cur-filter").html("None");

            }

        },
        filterMeetingsHelper = function (cat) {
            let meeting_present = false;
            let class_names = $("#meetings-container .class-name");
            for (let i = 0; i < class_names.length; i++) {
                let $name = $(class_names[i]);
                let $container = $name.closest(".element-container");
                if (cat && $name.html() != cat) {
                    $container.css("display", "none");

                    setTimeout(() => {
                        $container.removeClass("clicked")
                    }, 1000);

                    // console.log($container);
                    // class_names.style.display = "none";
                } else {
                    $container.css("display", "block");
                    if (!$container.hasClass("removed")) {
                        meeting_present = true;

                    }
                    // class_names.style.display = "block";

                }
            }
            if (!meeting_present) {
                // console.log("meeting gone");
                $("#no-meetings-notice").css("display", "block");
                for (let point of meta.meetings_pie.getSelectedPoints()) {
                    point.select(false);
                }
            } else {
                $("#no-meetings-notice").css("display", "none");

            }
        },
        updateMeetingsPage = function () {
            console.log("udpating");
            let deleted = 0;
            for (let i = 0; i < sorted_meetings.length; i++) {
                if (!sorted_meetings[i]) {
                    deleted++;
                    continue;
                }
                $("#" + i + " .class-name").html(sorted_meetings[i].category);
            }
            $("#meeting-number").html(sorted_meetings.length - deleted);
            // console.log(sorted_meetings);
            if (meta.rendered) {

                filterMeetingsHelper(meta.filter);

                updateCategoryFrequency();
                meta.meetings_pie.series[0].setData(meta.meetings_pie_data);
                console.log(meta.meetings_pie_data);


            }

        },
        animateMeetingsPage = function () {
            console.log(meta.seen);
            if (!meta.seen) {
                meta.seen = true;
                new CountUp('meeting-number', 0, sorted_meetings.length).start();
                meta.meetings_pie.series[0].animate();

            }
        },
        getMeetingById = function (id) {
            return sorted_meetings[id];
        }
    return {
        filterMeetings: filterMeetings,
        setUpPage: setUpMeetingsPage,
        animate: animateMeetingsPage,
        update: updateMeetingsPage,
        get_sorted_meetings: () => sorted_meetings,
        getMeetingById: getMeetingById
    }
}();
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
            setUpInteractivity();
            
        }
    },
        setUpInteractivity = function () {
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
        },
        createLeaderboardPage = function ($leaderboard, data) {
            let $input = $leaderboard.find("input.page-input");
            $input.change(function () {
                updateLeaderboard($leaderboard, $input, data);
            });
            $leaderboard.find(".max-items-selector button").on('click', function () {
                let $button = $(this);
                $leaderboard.find("button").removeClass("selected");
                $button.addClass("selected");
                SETTINGS.max_per_page = parseInt($button.attr("val"));
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

            let $active_button = $leaderboard.find("button[val=" + SETTINGS.max_per_page + "]");
            if ($active_button.length == 0) {
                SETTINGS.max_per_page = 10;
                $active_button = $leaderboard.find("button[val=" + SETTINGS.max_per_page + "]");
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
            let max_per_page = SETTINGS.max_per_page == -1 ? data.length : SETTINGS.max_per_page;

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
let MeetStorage = function () {
    let user_database, cur_meeting, meeting_database, all_cur_meetings,
        STR = {
            cur_meetings: "cur_meetings",
            users: "users",
            all_other_meetings: "other_meetings",
            all_cur_meetings: "cur_meetings"
        };
    let processStorageChanges = function (changes) {
        let cur_meet_update = false;
        for (var key in changes) {
            let change_obj = changes[key]
            let cur_change = change_obj.newValue;
            if (key === STR.cur_meetings) {
                updateCurMeetingData(cur_change);
                cur_meet_update = true;
            } else if (key === STR.users) {
                user_database = cur_change;
                console.log("updated user_database to ", user_database);
                cur_meet_update = true;

            }
        }
        if (cur_meet_update && cur_meeting) {
            $("[ref='C'] .full-disp").css('display', 'none');
            SpeakingUtil.updateSpeakerData(cur_meeting, $("#speaker-graph"));
        }
    },
        addCategory = function (cat) {
            if (cat.replaceAll(" ", "") != "" && !meeting_database[cat]) {
                meeting_database[cat] = [];
                updateMeetingStorage();
                return true;
            } else {
                return false;
            }
        },
        remove_category = function (cat) {
            if (meeting_database[cat]) {
                for (let i = 0; i < meeting_database[cat].length; i++) {
                    meeting_database[cat][i].category = consts.UNCAT;
                    meeting_database[consts.UNCAT].push(meeting_database[cat][i]);
                }
                delete meeting_database[cat];
                updateMeetingStorage();

            }
        },
        getFromStorage = function (key) {
            return new Promise((re) => {
                chrome.storage.local.get(key, function (result) {
                    re(result[key]);
                });
            });
        },
        updateMeetingStorage = function () {
            // console.log("updating meeting storage");
            if (!debug) {
                chrome.storage.local.set({ [STR.all_other_meetings]: meeting_database });

            }
            MeetingHistory.update();
        },
        cleanDatabase = function () {
            //TODO: Also merge any users who have changed pfp
            for (let [key] of Object.entries(meeting_database)) {
                for (let i = 0; i < meeting_database[key].length; i++) {
                    meeting_database[key][i].category = key;
                }
            }
        },
        getAllData = function () {
            chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
                chrome.tabs.sendMessage(tabs[0].id, { type: "get_meeting_data" }, async function (data) {

                    if (chrome.runtime.lastError) {
                        CurrentMeeting.render("You aren't in a call yet!");
                    } else {
                        user_database = data.user_database; //TODO: Why is user_database passed in here
                        cur_meeting = data.cur_meeting;
                        if (!cur_meeting) {
                            CurrentMeeting.render("No data yet!");
                        } else {
                            CurrentMeeting.render();
                        }
                    }

                    meeting_database = await getFromStorage(STR.all_other_meetings);
                    user_database = await getFromStorage(STR.users);
                    all_cur_meetings = await getFromStorage(STR.all_cur_meetings);
                    if (meeting_database) {
                        cleanDatabase();
                        MeetingHistory.setUpPage();
                        SpeakingUtil.addDropMenuListener();
                    }
                })
            });
        },
        updateCurMeetingData = function (change) {
            if (!cur_meeting) {
                getAllData();
            } else {
                for (let meet of change) {
                    if (meet.meeting_code == cur_meeting.meeting_code) {
                        cur_meeting = meet;
                        break;
                    }
                }
            }

        },
        moveMeeting = function (moved_meeting, original_category, chosen_category) {
            meeting_database[original_category] = meeting_database[original_category].filter(item => item != moved_meeting);
            // console.log(meeting_database[original_category]);
            moved_meeting.category = chosen_category;
            meeting_database[chosen_category].push(moved_meeting);
            updateMeetingStorage();
        },
        init = function () {
            chrome.storage.onChanged.addListener(processStorageChanges);
            getAllData();
        },
        setCurMeetCategory = function (chosen_category) {
            cur_meeting.category = chosen_category;
            chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
                chrome.tabs.sendMessage(tabs[0].id, { type: "cur_meeting_update", category: chosen_category });
            });
            updateMeetingStorage();
        }
    return {
        init: init,
        updateMeetingStorage: updateMeetingStorage,
        remove_category: remove_category,
        moveMeeting: moveMeeting,
        addCategory: addCategory,
        get_user_database: () => user_database,
        get_cur_meeting: () => cur_meeting,
        get_meeting_database: () => meeting_database,
        get_all_cur_meetings: () => all_cur_meetings,
        setCurMeetCategory: setCurMeetCategory
    }
}();
let CurrentMeeting = function () {
    let user_data = [];
    let render = function (str) {
        if (str) {
            $("[ref='C'] .full-disp").css('display', 'flex');
            $("[ref='C'] .full-disp").html(str);
        } else {

            $("[ref='C'] .full-disp").css('display', 'none');
            $(".selected-class p").html(MeetStorage.get_cur_meeting().category);

            SpeakingUtil.updateSpeakerData(MeetStorage.get_cur_meeting(), $("#speaker-graph"));
        }
    }
    return {
        get_user_data: () => user_data,
        render: render
    }
}();
let SpeakingUtil = function () {
    let addDropMenuListener = function () {
        $(".drop-menu").on('click', ".drop-menu-item", function (ev) {
            let $list_item = $(ev.target).closest('.drop-menu-item');
            if ($(ev.target).closest(".drop-menu-item-remove").length > 0) {

                MeetStorage.remove_category($list_item.find(".drop-menu-text").html());
                $list_item.remove();
            } else if ($list_item.closest("[type='add-new']").length == 0) {
                let original_category = $list_item.closest(".class-selector").find(".selected-class p").html();
                let chosen_category = $list_item.find(".drop-menu-text").html();
                if ($list_item.closest(".main").length > 0) {
                    MeetStorage.setCurMeetCategory(chosen_category);
                } else {
                    let id = parseInt($list_item.closest(".element-container").attr("id"));
                    let moved_meeting = MeetingHistory.getMeetingById(id);
                    MeetStorage.moveMeeting(moved_meeting, original_category, chosen_category);
                    // console.log(moved_meeting);
                    // console.log(meeting_database[original_category]);

                }
                let class_header = $(this).closest(".class-selector").find(".selected-class");
                class_header.find(".class-name").html(chosen_category);
                SpeakingUtil.toggleMeetingDropdown($list_item);
            } else {
                if ($list_item.closest("[ready='true']").length == 0) {
                    $list_item.addClass('active');
                    $list_item.attr('ready', 'true');
                    $list_item.find('input').focus();
                    $list_item.find('img').on('click', function () {
                        let $input = $(this).closest(".drop-menu-input").find("input");
                        let cat = $input.val();
                        $input.val("");
                        if (MeetStorage.addCategory(cat)) {
                            createListItem(undefined, cat, false).insertBefore($list_item);

                        }
                    });

                }

            }
        });
        $("input").on('click', (ev) => {
            ev.stopPropagation();
        });
    },
        toggleMeetingDropdown = function (this1) {
            let $menu = $(this).closest(".class-selector").find(".drop-menu");
            if ($menu.length == 0) {
                $menu = this1.closest(".class-selector").find(".drop-menu");
            }
            if ($menu.attr('moving')) {
                return;
            }
            let $class_selector = $menu.closest(".class-selector")
            $class_selector.toggleClass("clicked");

            if ($class_selector.hasClass("clicked")) {

                for (let cat of Object.keys(MeetStorage.get_meeting_database())) {
                    createListItem($menu, cat);
                }
                createListItem($menu, "Add Class...", true);



            } else {
                $menu.attr('moving', 'true');
                setTimeout(() => {
                    for (let item of $menu.children()) {
                        let $item = $(item);
                        $item.remove();

                    }
                    $menu.attr('moving', '');

                }, 400);
            }

        },
        createListItem = function ($menu, content, add_class = false) {
            let clone = $("#drop-menu-item")[0].content.cloneNode(true);
            clone.querySelector(".drop-menu-text").innerHTML = content;
            if (add_class) {
                clone.querySelector(".drop-menu-item").setAttribute('type', "add-new");

            }

            if ($menu) {
                if (content == consts.UNCAT) {
                    clone.querySelector(".drop-menu-item").classList.add('undeletable');
                }
                let $clone = $(clone).appendTo($menu);

                if (content == consts.UNCAT) {
                    $clone.addClass("undeletable");
                    // clone.classList.append("undeletable");
                }
                // if(add_class){

                //     $clone.find("input").on('keyup', function (event) {
                //         console.log('dfs');
                //         if (event.keyCode === 13) {
                //             console.log('et');
                //         }
                //      });
                // }

                return $clone;
            }
            return $(clone);

        },
        updateSpeakerData = function (meeting, chart, max_items = 7, one_time = false) {


            let max = 1;
            let users = [];
            if (!one_time) {
                users = CurrentMeeting.get_user_data();
            }
            for (let [id, user] of Object.entries(meeting.user_data)) {
                max = Math.max(max, user.speaking_time);
                let found = false;
                let img = MeetStorage.get_user_database()[id].IMG_ID;
                for (let user_stored of users) {
                    if (user_stored.ID == id) {
                        user_stored.DATA = user;
                        found = true;
                        break;
                    }
                }
                if (!found) {
                    users.push({
                        ID: id,
                        ID_parsed: id.replace("-", "").replace("=", ""),
                        DATA: user,
                        IMG: img
                    });
                }
            }
            users.sort((a, b) => {
                return b.DATA.speaking_time - a.DATA.speaking_time
            });
            window.requestAnimationFrame(() => {
                displaySpeakerData(users, chart, max, max_items);
            });
        },
        displaySpeakerData = function (users, chart, max, max_items) {
            if (!chart[0]._tippy) {
                tippy.delegate(chart[0], {
                    target: '.bar-bar',
                    content(reference) {
                        return reference.getAttribute('tooltip-str');
                    },
                    inertia: true,
                    animation: 'shift-away-subtle'
                })

            }
            let item_num = Math.min(users.length, max_items);
            let pos = 0;
            let margin = 7;
            let height = Math.min((chart.height() - item_num * margin - margin / item_num) / item_num, 50);
            let count = 0;
            for (let user of users) {
                count++;

                if (chart.find("#" + user.ID_parsed).length == 0) {
                    let $clone = $(document.getElementById("speaker-bar").content.cloneNode(true));
                    $clone.find(".bar").attr("id", user.ID_parsed);
                    $clone.find(".bar-img").attr("src", user.IMG);
                    chart.append($clone);

                }
                let entire_bar = chart.find("#" + user.ID_parsed);
                let bar = chart.find("#" + user.ID_parsed + " .bar-bar");
                let bar_container = entire_bar.find(".bar-bar-container");
                entire_bar.css("top", pos + "px");
                entire_bar.css("height", height + "px");

                bar.css("width", (user.DATA.speaking_time / max * 100) + "%");
                bar.attr('val', MeetStorage.get_user_database()[user.ID].NAME);
                bar_container.find(".bar-txt-overflow").html(MeetStorage.get_user_database()[user.ID].NAME);
                // bar_container.attr('style', '--val: '+ user_database[user.ID].NAME+";");

                let str = Util.msToString(user.DATA.speaking_time);
                if (bar[0]._tippy) {
                    bar[0]._tippy.setContent(str);
                } else {
                    bar.attr("tooltip-str", str);
                }
                if (chart.attr("id") == "speaker-graph") { //Only make active bars green if it's the ongoing meeting
                    if (user.DATA.is_speaking) {
                        entire_bar.addClass('active');
                    } else {
                        entire_bar.removeClass('active');
                    }
                }
                if (count <= max_items) {
                    entire_bar.css('opacity', 1);
                    pos += height + margin;
                } else {
                    entire_bar.css('opacity', 0);
                }

            }


        }


    return {
        toggleMeetingDropdown: toggleMeetingDropdown,
        addDropMenuListener: addDropMenuListener,
        updateSpeakerData: updateSpeakerData
    }
}();






// function renderSubCharts(_, _, config) {
//     let i = config.dataPointIndex;
//     if (i != -1) {
//         let cat = main_bar_data[i][0];
//         let data_one = [];
//         let data_two_raw = [];
//         let data_two = [];
//         for (let meet of meeting_database[cat]) {
//             let t = 0;
//             for (let [id, user] of Object.entries(meet.user_data)) {
//                 if (!data_two_raw[user_database[id].NAME]) {
//                     data_two_raw[user_database[id].NAME] = [user.speaking_time, 1];
//                 } else {
//                     data_two_raw[user_database[id].NAME][0] += user.speaking_time;
//                     data_two_raw[user_database[id].NAME][1]++;

//                 }


//                 t += user.speaking_time;
//             }


//             t /= 60000;
//             t = parseInt(t * 100) / 100;
//             data_one.push([meet.lastUpdated, t]);
//         }
//         for ([key, val] of Object.entries(data_two_raw)) {
//             data_two.push([key, parseInt(val[0] / val[1] / 60000 * 100) / 100]);
//         }
//         data_two.sort((a, b) => b[1] - a[1]);
//         data_two = data_two.slice(1, 7);
//         // console.log(data_one, data_two_raw);
//         data_one.sort((a, b) => a[0] - b[0]);
//         $("#meeting-graph-one").html("");
//         $("#meeting-graph-two").html("");

//         createChart(undefined, data_one, "Speaking Time", $("#meeting-graph-one")[0], graph_templates.meeting_bar_one);
//         createChart(arCol(data_two, 0), arCol(data_two, 1), "Minutes", $("#meeting-graph-two")[0], graph_templates.meeting_bar_two);

//         setTimeout(() => {
//             $("#meeting-data-container")[0].scrollIntoView({ behavior: "smooth", block: "end", inline: "nearest" });
//         }, 100);
//         $("#meeting-title span").html(cat)
//         $("#meeting-data-container").addClass("active");
//     }

// }






















// $(document).on("mousemove", function (event) {
//     let bar = $(document.elementFromPoint(event.clientX, event.clientY)).closest(".bar");

//     let $graph = $(document.elementFromPoint(event.clientX, event.clientY)).closest(".element-container").find(".graph-container");

//     let $tool_tip = $graph.find(".tool-tip");

//     if (bar.length > 0) {
//         $tool_tip.css("opacity", 1);
//         if (!$tool_tip.attr("cur_interval")) {
//             let interval = setInterval(() => {
//                 let ms = parseInt(bar.attr("data"));
//                 let seconds = parseInt(ms / 1000);
//                 let minutes = parseInt(seconds / 60);
//                 let hours = parseInt(minutes / 60);
//                 minutes %= 60;
//                 seconds %= 60;

//                 minutes = ("00" + minutes).slice(-2);
//                 seconds = ("00" + seconds).slice(-2);

//                 if (hours == 0) {
//                     $tool_tip.html("Speaking time: " + minutes + ":" + seconds);
//                 } else {
//                     $tool_tip.html("Speaking time: " + hours + ":" + minutes + ":" + seconds);
//                 }
//             }, 50);
//             $tool_tip.attr("cur_interval", interval);
//         }

//     } else {

//         let interval = $tool_tip.attr("cur_interval");
//         if (interval) {
//             clearInterval(interval);
//             $tool_tip.attr("cur_interval", "");
//         }
//         $(".tool-tip").css("opacity", 0);
//     }
//     $tool_tip.css({
//         "left": event.clientX - $tool_tip.width() / 2,
//         "top": event.clientY + 10
//     });
// });

//The below code is not currently being used
//Commented because I don't think it's even run
// Chart.plugins.register({ //sorting
//     beforeUpdate: function (chart) {
//         if (chart.options.sort) {
//             let dataArray = chart.data.datasets[0].data.slice();

//             let dataIndexes = dataArray.map((d, i) => i);
//             dataIndexes.sort((a, b) => {
//                 return dataArray[a] - dataArray[b];
//             });

//             // sort data array as well
//             dataArray.sort((a, b) => a - b);

//             // At this point dataIndexes is sorted by value of the data, so we 
//             //know how the indexes map to each other
//             let meta = chart.getDatasetMeta(0);
//             let newMeta = [];
//             let labels = chart.data.labels;
//             let newLabels = [];
//             let newColors = [];

//             meta.data.forEach((a, i) => {
//                 newMeta[dataIndexes[i]] = a;
//                 newLabels[dataIndexes[i]] = chart.data.labels[i];
//                 newColors[dataIndexes[i]] = chart.data.datasets[0].backgroundColor[i];
//             });

//             meta.data = newMeta;
//             chart.data.datasets[0].data = dataArray;
//             chart.data.labels = newLabels;
//             chart.data.datasets[0].backgroundColor = newColors;
//             chart.data.datasets[0].borderColor = newColors;
//         }
//     }
// });

// function renderMainCharts() {
//     for (let cat of Object.keys(meeting_database)) {
//         let total = 0;

//         for (let meeting of meeting_database[cat]) {
//             for (let user of Object.values(meeting.user_data)) {
//                 total += user.speaking_time;
//             }
//         }
//         total /= meeting_database[cat].length;
//         total /= 60000;
//         if (total > 0) {
//             main_bar_data.push([cat, total.toFixed(2)]);

//         }
//     }
//     main_bar_data.sort((a, b) => b[1] - a[1]);
//     console.log(main_bar_data);
//     createChart(arCol(main_bar_data, 0), arCol(main_bar_data, 1), "Minutes", $("#main-bar")[0], graph_templates.main_bar);
// }