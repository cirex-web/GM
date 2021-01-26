let STR = {
    cur_meetings: "cur_meetings",
    users: "users",
    all_other_meetings: "other_meetings",
    all_cur_meetings: "cur_meetings"
}
//TODO: deal with page refresh... should refresh data or something
//TODO: It's just dead
let user_database, cur_meeting, meeting_database, all_cur_meetings;
let timeGraph_obj;
let page;
let seen_analysis = false, rendered_meetings_page = false;
let timer_graph_data = [];
let sorted_meetings = [];

let header_names = {
    'C': "Current Meeting",
    "H": "Meeting History",
    "A": "Analysis"
}
let graph_templates = {
    main_bar: {
        chart: {
            type: 'bar',
            toolbar: {
                show: false
            },
            events: {
                click: function (_, _, config) {
                    let i = config.dataPointIndex;
                    if (i != -1) {
                        let cat = main_bar_data[i][0];
                        let data_one = [];
                        let data_two_raw = [];
                        let data_two = [];
                        for(let meet of meeting_database[cat]){
                            let t =0;
                            for(let [id,user] of Object.entries(meet.user_data)){
                                if(!data_two_raw[user_database[id].NAME]){
                                    data_two_raw[user_database[id].NAME]=[user.speaking_time,1];
                                }else{
                                    data_two_raw[user_database[id].NAME][0]+=user.speaking_time;
                                    data_two_raw[user_database[id].NAME][1]++;

                                }

                                
                                t+=user.speaking_time;
                            }


                            t/=60000;
                            t = parseInt(t*100)/100;
                            data_one.push([meet.lastUpdated,t]);
                        }
                        for([key,val] of Object.entries(data_two_raw)){
                            data_two.push([key,parseInt(val[0]/val[1]/60000*100)/100]);
                        }
                        data_two.sort((a,b)=>b[1]-a[1]);
                        data_two = data_two.slice(1,7);
                        console.log(data_one,data_two_raw);
                        data_one.sort((a,b)=>a[0]-b[0]);
                        $("#meeting-graph-one").html("");
                        $("#meeting-graph-two").html("");

                        createChart(undefined,data_one,"Speaking Time",$("#meeting-graph-one")[0],"meeting_bar_one");
                        createChart(arCol(data_two,0),arCol(data_two,1),"Minutes",$("#meeting-graph-two")[0],"meeting_bar_two");

                        setTimeout(()=>{
                            $("#meeting-data-container")[0].scrollIntoView({behavior: "smooth", block: "end", inline: "nearest"});
                        },100);
                        $("#meeting-title span").html(cat)
                        $("#meeting-data-container").addClass("active");
                    }

                }
            },
        },
        dataLabels: {
            enabled: false,
            formatter: function (val) {
                return val + " min";
            },
        },
        plotOptions: {
            bar: {
                horizontal: true,
            }
        },
        title: {
            text: "Avg. Total Speaking Time per Class",
            align: "left",
            floating: false,
            margin: 10,
            style: {
                fontSize: "20px"
            }
        }
    },
    meeting_bar_one: {
        chart: {
            height: 142,
            width: "100%",
            type: "line",
            toolbar: {
                show: false
            }
        },
        xaxis: {
            type: 'datetime'
        },
        title: {
            text: "Speaking Time History",
            align: "left",
            floating: false,
            margin: 10,
            style: {
                fontSize: "20px"
            }
        }
    },
    meeting_bar_two:{
        chart: {
            height: 200,
            width: "100%",
            type: "bar",
            toolbar: {
                show: false
            }
        },
        dataLabels: {
            enabled: false
        },
        title: {
            text: "Most Active Students (Teacher Hidden)",
            align: "left",
            floating: false,
            margin: 10,
            style: {
                fontSize: "15px"
            }
        },
        plotOptions: {
            bar: {
                horizontal: true,
            }
        }
        

    }

}
let main_bar_data = [];


const fac = new FastAverageColor();
const arCol = (arr, n) => arr.map(x => x[n]);

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
    getAllData();
    setUpTabs();

    getVersion((version)=>{
        $("#version").html(version);
    });

    chrome.storage.onChanged.addListener(processStorageChanges);
}
function createChart(x, y, label_name, container, template_name) {

    let options = $.extend({}, graph_templates[template_name], {
        series: [{
            name: label_name,
            data: y
        }],


    });
    if (x) {
        $.extend(options,{
            xaxis: {
                categories: x
            }
        });
    }
    var chart = new ApexCharts(container, options);

    chart.render();
}
function setUpTabs() {
    $(".selected-class").on("click", toggleMenu);
    $(".tab-button").click(function (evt) {
        let btn = $(evt.currentTarget);
        let x = evt.pageX - btn.offset().left;
        let y = evt.pageY - btn.offset().top;
        page = $(this).attr("ref");
        let ripple = $(`<span class="ripple"></span>`).appendTo($(this)).css({
            left: x,
            top: y
        });
        setTimeout(()=>{
            ripple.remove();
        },500);
        $("#tab-container-heading").html(header_names[page]);
        $(".tab-container").css("display", "none");
        $(".tab-icon").each((_, tab) => {
            tab.src = tab.src.replace("-active", "");

            if ($(tab).closest("[ref='"+page+"']").length>0) {
                tab.src = tab.src.replace(".", "-active.");
            }
        });


        $(".tab-container[ref=" + page + "]").css("display", "block");
        if (page == "A" && !seen_analysis && meeting_database && Object.keys(meeting_database).length>0) {
            $("[ref='A'] .full-disp").css('display','none');

            renderMainCharts();
            seen_analysis = true;
        }
        $(this).addClass("selected");
    });
    $("[ref='C']").click();
}
function renderMainCharts() {
    for (let cat of Object.keys(meeting_database)) {
        let total = 0;

        for (let meeting of meeting_database[cat]) {
            for (let user of Object.values(meeting.user_data)) {
                total += user.speaking_time;
            }
        }
        total /= meeting_database[cat].length;
        total /= 60000;
        if (total > 0) {
            main_bar_data.push([cat, total.toFixed(2)]);

        }
    }
    main_bar_data.sort((a, b) => b[1] - a[1]);
    console.log(main_bar_data);
    createChart(arCol(main_bar_data, 0), arCol(main_bar_data, 1), "Minutes", $("#main-bar")[0], "main_bar");
}
function processStorageChanges(changes) {
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
    if (cur_meet_update&&cur_meeting) {
        $("[ref='C'] .full-disp").css('display', 'none');
        updateSpeakerData3(cur_meeting, $("#speaker-graph"));
    }
}
function getAllData() {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        chrome.tabs.sendMessage(tabs[0].id, { type: "get_meeting_data" }, async function (data) {

            if (chrome.runtime.lastError) {
                $("[ref='C'] .full-disp").html("You aren't in a call yet!");

            } else {
                user_database = data.user_database;
                cur_meeting = data.cur_meeting;
                // all_cur_meetings = data.all_cur_meetings;
                console.log("data retrieved: ", data);

                if (!cur_meeting) {
                    $("[ref='C'] .full-disp").html("No data yet!");
                } else {
                    $("[ref='C'] .full-disp").css('display', 'none');

                    updateSpeakerData3(cur_meeting, $("#speaker-graph"));
                    $(".selected-class p").html(cur_meeting.category);
                }
            };

            meeting_database = await getFromStorage(STR.all_other_meetings);
            user_database = await getFromStorage(STR.users);
            all_cur_meetings = await getFromStorage(STR.all_cur_meetings);

            if (!rendered_meetings_page&&meeting_database) {
                $("[ref='H'] .full-disp").css('display','none');
                setUpMeetingsPage();
                addDropMenuListener();
                rendered_meetings_page = true;
            }
        })
    });
}
function addDropMenuListener() {
    $(".drop-menu").on('click', ".drop-menu-item", function (ev) {
        let $list_item = $(ev.target).closest('.drop-menu-item');
        if ($list_item.closest("[type='add-new']").length == 0) {
            let original_category = $list_item.closest(".class-selector").find(".selected-class p").html();
            let chosen_category = $list_item.find(".drop-menu-text").html();
            if ($list_item.closest(".main").length > 0) {
                cur_meeting.category = chosen_category;
                chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
                    chrome.tabs.sendMessage(tabs[0].id, { type: "cur_meeting_update", category: chosen_category });
                });
            } else {
                let moved_meeting = sorted_meetings[parseInt($list_item.closest(".element-container").attr("id"))];
                console.log(moved_meeting);
                console.log(meeting_database[original_category]);
                meeting_database[original_category] = meeting_database[original_category].filter(item => item != moved_meeting);
                console.log(meeting_database[original_category]);
                moved_meeting.category = chosen_category;
                meeting_database[chosen_category].push(moved_meeting);
            }
            updateMeetingStorage();
            let class_header = $(this).closest(".class-selector").find(".selected-class");
            class_header.find("p").html(chosen_category);
            toggleMenu($list_item);
        } else {
            if ($list_item.closest("[ready='true']").length == 0) {
                $list_item.addClass('active');
                $list_item.attr('ready', 'true');
                $list_item.find('input').focus();
                $list_item.find('img').on('click', function () {
                    let cat = $(this).closest(".drop-menu-input").find("input").val();
                    if (addCategory(cat)) {
                        createListItem(undefined, cat, false).insertBefore($list_item);

                    }
                });

            }

        }
    });
    $("input").on('click', (ev) => {
        ev.stopPropagation();
    });
}
function addCategory(cat) {
    if (cat != "" && !meeting_database[cat]) {
        meeting_database[cat] = [];
        updateMeetingStorage();
        return true;
    } else {
        return false;
    }
}
function toggleMenu(this1) {

    let $menu = $(this).closest(".class-selector").find(".drop-menu");
    if ($menu.length == 0) {
        $menu = this1.closest(".class-selector").find(".drop-menu");
    }
    if ($menu.attr('moving')) {
        return;
    }

    $menu.toggleClass("active");

    if ($menu.hasClass("active")) {

        for (let cat of Object.keys(meeting_database)) {
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

}
function createListItem($menu, content, add_class = false) {
    let clone = $("#drop-menu-item")[0].content.cloneNode(true);
    clone.querySelector(".drop-menu-text").innerHTML = content;
    if (add_class) {
        clone.querySelector(".drop-menu-item").setAttribute('type', "add-new");
    }
    if ($menu) {
        $menu.append(clone);

    } else {
        return $(clone);
    }
}
function setUpMeetingsPage() {
    for (let cat of Object.keys(meeting_database)) {
        for (let meeting of meeting_database[cat]) {
            sorted_meetings.push(meeting);
        }
    }
    for(let meeting of all_cur_meetings){
        sorted_meetings.push($.extend(meeting,{
            cur: true
        }));
    }
    sorted_meetings.sort((a, b) => b.lastUpdated - a.lastUpdated);

    for (let [i, meeting] of sorted_meetings.entries()) {

        let clone = $("#meeting-data")[0].content.cloneNode(true);
        let $clone = $(clone);
        if(meeting.cur){
            $clone.find(".element-container").addClass("live");   
        }
        $clone.find(".meeting-top .class-name").html(meeting.category);
        $clone.find(".date").html(generateDate(meeting.lastUpdated));
        $clone.find(".code").html(meeting.meeting_code);
        $clone.find(".element-container").attr('id', i);
        // $clone.find(".selected-class").on('click',);
        $("[ref='H'].tab-container").append($clone);

    }
    $(".meeting-top").on('click', function (ev) {
        if ($(ev.target).hasClass('trash')) {
            return;
        }
        let $element_container = $(this).closest('.element-container');
        let $bottom = $element_container.find(".meeting-data");
        let $drop_menu = $(this).find(".drop-menu");
        let class_selector = $(ev.target).closest(".selected-class");
        if (class_selector.length > 0 && $bottom.hasClass("active") && !$(ev.target).closest(".element-container").hasClass('live')) {

            toggleMenu(class_selector);

        } else if (!$drop_menu.hasClass('active')) {
            $bottom.toggleClass("active");
            if ($bottom.hasClass("active")) {
                let $graph = $bottom.find(".graph-container");
                // console.log(sorted_meetings[parseInt(graph.attr('id'))]);
                updateSpeakerData3(sorted_meetings[parseInt($element_container.attr('id'))], $graph, 10, true);

            }
        }



    });
    $(".trash").on('click', function () {
        let $container = $(this).closest(".element-container");
        let id = parseInt($container.attr("id"));
        let cat = sorted_meetings[id].category;
        meeting_database[cat] = meeting_database[cat].filter(item => item != sorted_meetings[id]);
        $container.addClass("removed");
        updateMeetingStorage();
        setTimeout(() => {
            $container.remove();

        }, 200);
    });
    $(".class-selector").on('mouseover mouseleave', function (ev) {
        $this = $(this);
        if (ev.type == "mouseover" && ($this.hasClass('main') || $this.closest(".element-container").find(".meeting-data").hasClass("active"))) {
            if(!$(ev.target).closest(".element-container").hasClass('live')){ 
                $this.addClass("active");

            }
        } else {
            if (!$this.find(".drop-menu").hasClass('active')) {
                $this.removeClass("active");

            }
        }

    });
    tippy('.question',{
        content: "This meeting is ongoing and has not yet been moved to permanent storage."
    })
}
function generateDate(mm) {
    let date = new Date(mm);
    return date.toLocaleString("en-US", { timeZoneName: "short" });
}
function getFromStorage(key) {
    return new Promise((re) => {
        chrome.storage.local.get(key, function (result) {
            re(result[key]);
        });
    });
}
function updateMeetingStorage() {
    // console.log("updating meeting storage");
    chrome.storage.local.set({ [STR.all_other_meetings]: meeting_database });
}
function updateSpeakerData3(meeting, chart, max_items = 7, one_time = false) {


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
    displaySpeakerData(users, chart, max, max_items);
}
function displaySpeakerData(users, chart, max, max_items) {
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

        entire_bar.css("top", pos + "px");
        entire_bar.css("height", height + "px");

        bar.css("width", (user.DATA.speaking_time / max * 100) + "%");
        bar.attr('val', user_database[user.ID].NAME);

        let str = msToString(user.DATA.speaking_time);
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
function msToString(ms) {
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
}
function updateCurMeetingData(change) {
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

}
function getVersion(callback) {
    var xmlhttp = new XMLHttpRequest();
    xmlhttp.open('GET', '../manifest.json');
    xmlhttp.onload = function (e) {
        var manifest = JSON.parse(xmlhttp.responseText);
        callback(manifest.version);
    }
    xmlhttp.send(null);
}



























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

/*
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
*/