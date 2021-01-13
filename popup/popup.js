let STR = {
    cur_meetings: "cur_meetings",
    users: "users",
    all_other_meetings: "other_meetings"
}
//TODO: deal with page refresh... should refresh data or something

let user_database, cur_meeting, meet_code, meeting_database; //these are the variables that contain the current meeting data (they're updated automatically and updateSpeakerData() is called everytime there's an update.)
let timeGraph_obj;
let page;
let timer_graph_data = [];
let sorted_meetings = [];

let header_names = {
    'D': "Debug",
    'C': "Current Meeting",
    "H": "Meeting History",
    "A": "Analysis"
}
const fac = new FastAverageColor();

/*
//user_database contains every seen user
key: image ID, (Generated at time of first appearance and condensed)
value: {
    IMG_ID: current pfp URL (NOT identical to key. Multiple users may have the same IMG_ID attribute, which means that they're the same person)
    NAME: user name
    TIME_CREATED: time when first seen on google meet (not relevant here) 
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
    is_speaking: Maybe relevant
    speaking_time: yes  
}

*/
window.onload = () => {
    chrome.storage.onChanged.addListener(function (changes) {
        let prev_meeting;

        for (var key in changes) {
            let change_obj = changes[key]
            let cur_change = change_obj.newValue;
            let before_change = change_obj.oldValue;
            if (key === STR.cur_meetings) {

                cur_meeting = searchForMeet(cur_change);
                prev_meeting = searchForMeet(before_change);
            } else if (key === STR.users) {
                user_database = cur_change;
                console.log("updated user_database to ", user_database);

            }
        }
        updateSpeakerData3(cur_meeting, $("#speaker-graph"));
        // console.log(timeGraph_obj.data);
        // updateSpeakerData2(prev_meeting, cur_meeting);
        // updateSpeakerData();
    });
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        chrome.tabs.sendMessage(tabs[0].id, { type: "get_meeting_data" }, async function (data) {

            if (chrome.runtime.lastError) {
                $("#full-disp").html("You aren't in a call yet!");

            } else {
                user_database = data.user_database;
                cur_meeting = data.cur_meeting;
                console.log("data retrieved: " + data);



                if (!cur_meeting) {
                    $("#full-disp").html("No data yet!");
                } else {
                    $("#full-disp").css('display', 'none');
                    meet_code = cur_meeting.meeting_code;

                    updateSpeakerData3(cur_meeting, $("#speaker-graph"));
                    $(".selected-class p").html(cur_meeting.category);
                }
            };
            meeting_database = await getFromStorage(STR.all_other_meetings);
            user_database = await getFromStorage(STR.users);
            setUpMeetingsPage();
            $(".drop-menu").on('click', ".drop-menu-item", function (ev) {
                if ($(ev.target).closest("[type='add-new']").length==0) {
                    cur_meeting.category = $(ev.target).html(); //TODO:
                    let class_header = $(this).closest(".class-selector").find(".selected-class");
                    class_header.find("p").html(cur_meeting.category);
                    console.log("in");
                    toggleMenu($(ev.target));
                }
            });
            $("[ref='C']").click();
        })
    });

    $(document).on("mousemove", function (event) {
        let bar = $(document.elementFromPoint(event.clientX, event.clientY)).closest(".bar");

        let $graph = $(document.elementFromPoint(event.clientX, event.clientY)).closest(".element-container").find(".graph-container");

        let $tool_tip = $graph.find(".tool-tip");

        if (bar.length > 0) {
            $tool_tip.css("opacity", 1);
            if (!$tool_tip.attr("cur_interval")) {
                let interval = setInterval(() => {
                    let ms = parseInt(bar.attr("data"));
                    let seconds = parseInt(ms / 1000);
                    let minutes = parseInt(seconds / 60);
                    let hours = parseInt(minutes / 60);
                    minutes %= 60;
                    seconds %= 60;

                    minutes = ("00" + minutes).slice(-2);
                    seconds = ("00" + seconds).slice(-2);

                    if (hours == 0) {
                        $tool_tip.html("Speaking time: " + minutes + ":" + seconds);
                    } else {
                        $tool_tip.html("Speaking time: " + hours + ":" + minutes + ":" + seconds);
                    }
                }, 50);
                $tool_tip.attr("cur_interval", interval);
            }

        } else {

            let interval = $tool_tip.attr("cur_interval");
            if (interval) {
                clearInterval(interval);
                $tool_tip.attr("cur_interval", "");
            }
            $(".tool-tip").css("opacity", 0);
        }
        $tool_tip.css({
            "left": event.clientX - $tool_tip.width() / 2,
            "top": event.clientY + 10
        });
    });
    $(".selected-class").on("click", toggleMenu);
    $(".tab").click(function () {
        page = $(this).attr("ref");

        $("#tab-container-heading").html(header_names[page]);
        $(".tab-container").css("display", "none");
        $(".tab").removeClass("selected");

        $(".tab-container[ref=" + page + "]").css("display", "block");
        $(this).addClass("selected");
    });


}
function toggleMenu(this1) {

    console.log("toggling");
    let $menu = $(this).closest(".class-selector").find(".drop-menu");
    if ($menu.length == 0) {
        $menu = this1.closest(".class-selector").find(".drop-menu");
    }
    $menu.toggleClass("active");

    if ($menu.hasClass("active")) {

        for (let cat of Object.keys(meeting_database)) {
            let clone = $("#drop-menu-item")[0].content.cloneNode(true);
            clone.querySelector(".drop-menu-item").innerHTML = cat;
            $menu.append(clone);
        }

    } else {
        setTimeout(() => {
            for (let item of $menu.children()) {
                let $item = $(item);
                if ($item.attr("type") != "add-new") {
                    $item.remove();
                }
            }

        }, 400);
    }

}
function setUpMeetingsPage() {
    for (let cat of Object.keys(meeting_database)) {
        for (let meeting of meeting_database[cat]) {
            sorted_meetings.push(meeting);
        }
    }
    sorted_meetings.sort((a, b) => b.lastUpdated - a.lastUpdated);

    for (let [i, meeting] of sorted_meetings.entries()) {
        let clone = $("#meeting-data")[0].content.cloneNode(true);
        let $clone = $(clone);
        $clone.find(".meeting-top p").html(meeting.category);
        $clone.find(".date").html(meeting.lastUpdated);
        $clone.find(".code").html(meeting.meeting_code);
        $clone.find(".graph-container").attr('id', i);
        // $clone.find(".selected-class").on('click',);
        $("[ref='H'].tab-container").append($clone);

    }
    $(".meeting-top").on('click', function (ev) {
        let $bottom = $(this).parent().find(".meeting-data");
        let $drop_menu = $(this).find(".drop-menu");
        let class_selector = $(ev.target).closest(".selected-class");
        if (class_selector.length > 0 && $bottom.hasClass("active")) {

            toggleMenu(class_selector);

        } else if(!$drop_menu.hasClass('active')){
            $bottom.toggleClass("active");
            if ($bottom.hasClass("active")) {
                let graph = $bottom.find(".graph-container");
                // console.log(sorted_meetings[parseInt(graph.attr('id'))]);
                updateSpeakerData3(sorted_meetings[parseInt(graph.attr('id'))], graph, 9, true);

            }
        }



    });
    $(".class-selector").on('mouseover mouseleave', function (ev) {
        $this = $(this);
        if (ev.type == "mouseover" && $this.closest(".element-container").find(".meeting-data").hasClass("active")) {

            $this.addClass("active");
        } else {
            if (!$this.find(".drop-menu").hasClass('active')) {
                $this.removeClass("active");

            }
        }

    });
}
function getFromStorage(key) {
    return new Promise((re) => {
        chrome.storage.local.get(key, function (result) {
            re(result[key]);
        });
    });
}

function updateSpeakerData3(meeting, item, max_items = 20, one_time = false) {
    let max = 1;
    let users = timer_graph_data;
    if (one_time) {
        users = [];
    }
    for (let [id, user] of Object.entries(meeting.user_data)) {
        max = Math.max(max, user.speaking_time);
        let found = false;
        let img = user_database[id].IMG_ID;
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
    })
    displaySpeakerData(users, item, max, max_items);
}
function displaySpeakerData(users, item, max, max_items) {
    console.log(users);
    let item_num = Math.min(users.length, max_items);
    let pos = 0;
    let margin = 10;
    let height = Math.min((item.height()-item_num*margin-margin/item_num) / item_num, 50);
    let count = 0;
    for (let user of users) {
        if (count == max_items) {
            break;
        } else {
            count++;
        }
        if (item.find("#" + user.ID_parsed).length == 0) {
            let $clone = $(document.getElementById("speaker-bar").content.cloneNode(true));
            $clone.find(".bar").attr("id", user.ID_parsed);
            $clone.find(".bar-img").attr("src", user.IMG);
            item.append($clone);

        }
        item.find("#" + user.ID_parsed).css("top", pos + "px");
        item.find("#" + user.ID_parsed).css("height", height + "px");
        item.find("#" + user.ID_parsed).attr("data", user.DATA.speaking_time);
        // $("#" + user.ID_parsed + " .bar-bar")[0].animate([
        //     {width: $("#" + user.ID_parsed + " .bar-bar").width()+"px"},

        //     {width: (user.DATA.speaking_time / max * 100) + '%'}

        //   ], 500);
        item.find("#" + user.ID_parsed + " .bar-bar").css("width", (user.DATA.speaking_time / max * 100) + "%");

        item.find("#" + user.ID_parsed + " .bar-bar").attr('val', user_database[user.ID].NAME);
        item.find("#" + user.ID_parsed + " .bar-bar").css("width",);
        if (item.attr("id") == "speaker-graph") {
            if (user.DATA.is_speaking) {
                $("#" + user.ID_parsed + " .bar-bar").css("background", "green");
            } else {
                $("#" + user.ID_parsed + " .bar-bar").css("background", "");
            }
        }

        pos += height + margin;

    }


}































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

function updateSpeakerData2(old_data, new_data) {
    if (!timeGraph_obj) {
        return;
    }
    let ids = [];
    let promises = [];
    if (old_data) {

        for (let [id, _] of Object.entries(old_data.user_data)) {
            ids.push(id);
        }
    }
    for (let [id, user] of Object.entries(new_data.user_data)) {
        if (!ids.includes(id)) {
            promises.push(addUser(user));
        }
    }
    Promise.allSettled(promises).then(() => {
        // timeGraph_obj.update();
        let meta = timeGraph_obj.getDatasetMeta(0);
        let data = [];
        // data[0] = meta.data[1];
        // data[1] = meta.data[0];
        let temp = meta.data[0];
        meta.data[0] = meta.data[1];
        meta.data[1] = temp;

        meta.data = data;

        console.log(timeGraph_obj.getDatasetMeta(0).data);
        timeGraph_obj.update();

    });
}
function searchForMeet(change) {
    for (let meet of change) {
        if (meet.meeting_code == meet_code) {
            return meet;
        }
    }
}
function addUser(id, user) {
    return new Promise(re => {
        timeGraph_obj.data.labels.push(user_database[id].NAME);
        timeGraph_obj.data.datasets.forEach(async (dataset) => {
            dataset.data.push({
                y: user.speaking_time
            });
            dataset.backgroundColor.push(await fac.getColorAsync(user_database[id].IMG_ID));
            re();
        });
    })

}
function updateSpeakerData() {
    if (!timeGraph_obj) {
        return;
    }
    let str = "";
    let data = [];
    let color_set = [];
    let promises = [];
    let newMeta = [];
    let newLabels = [];
    let newColors = [];
    let meta = timeGraph_obj.getDatasetMeta(0);
    // console.log(meta);
    const fac = new FastAverageColor();
    for (let [id, user_data] of Object.entries(cur_meeting.user_data)) {
        str += user_database[id].NAME + ": " + user_data.speaking_time + "<br>";
        data.push({
            x: user_database[id].NAME,
            y: new Date(user_data.speaking_time)
        })

        let p = fac.getColorAsync(user_database[id].IMG_ID)
            .then(color => {
                color_set.push(color.hex);
            })
            .catch(e => {
                console.log(e);
            });
        promises.push(p);
    }

    // let dataIndexes = data_set.map((d, i) => i);
    // dataIndexes.sort((a, b) => {
    //     return data_set[a] - data_set[b];
    // });
    // data_set.sort((a, b) => a - b);

    $("#test").html(str);
    Promise.allSettled(promises).then(() => {
        // sorting right here so i dont have to change it twice
        meta.data.forEach((a, i) => {
            newMeta[dataIndexes[i]] = a;
            newLabels[dataIndexes[i]] = label_set[i];
            newColors[dataIndexes[i]] = color_set[i];
        });

        meta.data = newMeta;
        timeGraph_obj.data.datasets[0].data = data;
        timeGraph_obj.data.datasets[0].backgroundColor = color_set;
        timeGraph_obj.data.datasets[0].borderColor = color_set;
        timeGraph_obj.update();
    }
    );
}

function createChart() {

    let data = [];
    let labels = [];
    let color_set = [];
    let promises = [];

    for (let [id, user_data] of Object.entries(cur_meeting.user_data)) {
        labels.push(user_database[id].NAME);
        data.push({
            // x: user_database[id].NAME,
            y: user_data.speaking_time
        });
        let p = fac.getColorAsync(user_database[id].IMG_ID)
            .then(color => {
                color_set.push(color.hex);
            })
            .catch(e => {
                console.log(e);
            });


        promises.push(p);
    }
    console.log(data);
    Promise.allSettled(promises).then(() => {
        var ctx = document.getElementById('timeGraph').getContext('2d');
        let options = {
            maintainAspectRatio: false,
            scales: {
                xAxes: [{
                    display: true,
                    ticks: {
                        beginAtZero: true,
                    },
                    gridLines: {
                        color: "rgba(0, 0, 0, 0)",
                    }

                }],
                yAxes: [{
                    gridLines: {
                        color: "rgba(0, 0, 0, 0)",
                    },
                    offset: true,
                    type: 'time',
                    time: {
                        displayFormats: {
                            second: "mm:ss"
                        },
                        unit: 'second',

                    }
                }]
            },
            animation: {
                duration: 0
            }
        }
        timeGraph_obj = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    data: data,
                    backgroundColor: color_set,
                    borderColor: color_set,
                    borderWidth: 1
                }]
            },
            options: options
        });
        timeGraph_obj.options.sort = true;
        timeGraph_obj.update();
        timeGraph_obj.options.sort = false;
        updateSpeakerData();
    });
    // the getColorAsync function is necessary to get the average color of an unloaded image, but the way it is right now results in color_set being an empty set when the graph is made
}
