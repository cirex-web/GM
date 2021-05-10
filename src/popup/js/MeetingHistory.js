import {MeetStorage,Util,SpeakingUtil,Logger} from "./internal.js"


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
        sorted_meetings;
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
            $("[ref='H'] .full-disp").css('display', 'none');
            
            sorted_meetings = MeetStorage.getSortedMeetings(true);
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
                                SpeakingUtil.updateSpeakerData(sorted_meetings[parseInt($element_container.attr('id'))], $graph, 10);

                            }
                        }

                    }
                }

            });
            $(".meeting-page-trash").on('click', function () {
                let $container = $(this).closest(".element-container");
                let id = parseInt($container.attr("id"));
                MeetStorage.removeMeeting(id);                
                $container.addClass("removed");
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
            });

            SpeakingUtil.addDropMenuListener();

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
            Logger.verbose("Meeting History page is updating");
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
            if (!meta.seen) {
                meta.seen = true;
                new CountUp('meeting-number', 0, sorted_meetings.length).start();
                meta.meetings_pie.series[0].animate();

            }
        }
    return {
        filterMeetings: filterMeetings,
        setUp: setUpMeetingsPage,
        animate: animateMeetingsPage,
        update: updateMeetingsPage
    }
}();

export {MeetingHistory}
// module.exports.MeetingHistory = MeetingHistory;