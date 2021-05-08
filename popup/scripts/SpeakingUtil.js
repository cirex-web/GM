import {MeetStorage,Util, CONSTS, Logger} from "../scripts/internal.js"


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
                    let moved_meeting = MeetStorage.getSortedMeetings()[id];
                    Logger.verbose("Changed category of meeting ",moved_meeting);
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
                if (content == CONSTS.UNCAT) {
                    clone.querySelector(".drop-menu-item").classList.add('undeletable');
                }
                let $clone = $(clone).appendTo($menu);

                if (content == CONSTS.UNCAT) {
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
        updateSpeakerData = function (meeting, chart, max_items = 7, users = []) {


            let max = 1;
            
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
        toggleMeetingDropdown,
        addDropMenuListener,
        updateSpeakerData
    }
}();
export {SpeakingUtil}
