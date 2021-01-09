let STR = {
    cur_meetings: "cur_meetings",
    users: "users"
}
//TODO: deal with page refresh... should refresh data or something

let user_database, cur_meeting, meet_code; //these are the variables that contain the current meeting data (they're updated automatically and updateSpeakerData() is called everytime there's an update.)
let timeGraph_obj;
let page;
let timer_graph_data = [];
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
        updateSpeakerData3();
        // console.log(timeGraph_obj.data);
        // updateSpeakerData2(prev_meeting, cur_meeting);
        // updateSpeakerData();
    });
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        chrome.tabs.sendMessage(tabs[0].id, { type: "get_meeting_data" }, function (data) {

            if (chrome.runtime.lastError) {
                $("#test").html("You aren't in a call yet!");

            } else {
                user_database = data.user_database;
                cur_meeting = data.cur_meeting;
                console.log(data);
                
                if (!user_database || !cur_meeting) {
                    $("#test").html("No data yet!");
                } else {

                    meet_code = cur_meeting.meeting_code;
                    updateSpeakerData3();
                    // createChart();
                    // updateSpeakerData();

                }
            };
        })
    });

    $(".tab").click(function () {
        page = $(this).attr("ref");

        $("#tab-container-heading").html(header_names[page]);
        $(".tab-container").css("display", "none");
        $(".tab").removeClass("selected");

        $(".tab-container[ref=" + page + "]").css("display", "block");
        $(this).addClass("selected");
    });
    $(".tab[ref='C']").click();

}

function updateSpeakerData3(){
    let max = 1;
    for(let [id,user] of Object.entries(cur_meeting.user_data)){
        max = Math.max(max, user.speaking_time);
        let found = false;
        let img = user_database[id].IMG_ID;
        for(let user_stored of timer_graph_data){
            if(user_stored.ID == id){
                user_stored.DATA = user;
                found = true;
                break;
            }
        }
        if(!found){
            timer_graph_data.push({
                ID: id,
                ID_parsed: id.replace("-","").replace("=",""),
                DATA: user,
                IMG: img
            });
        }
    }
    timer_graph_data.sort((a,b)=>{
        return b.DATA.speaking_time-a.DATA.speaking_time
    })
    displaySpeakerData(max);
}
function displaySpeakerData(max){
    let pos = 20;
    let margin = 10;
    let height = 50;

    for(let user of timer_graph_data){
        if($("#"+user.ID_parsed).length==0){
            let $clone = $(document.getElementById("speaker-bar").content.cloneNode(true));
            $clone.find(".bar").attr("id",user.ID_parsed);
            $clone.find(".bar-img").attr("src",user.IMG);
            $("#speaker-graph").append($clone);
        }
        $("#"+user.ID_parsed).css("top",pos+"px");
        $("#"+user.ID_parsed+" .bar-bar").attr('val',user.DATA.speaking_time);
        $("#"+user.ID_parsed+" .bar-bar").css("width",(user.DATA.speaking_time/max*100)+"%");
        pos += height+margin;

        // console.log($("#"+user.ID_parsed+".bar-bar"));
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

function updateSpeakerData2(old_data, new_data){
    if (!timeGraph_obj) {
        return;
    }
    let ids = [];
    let promises = [];
    if(old_data){
        
        for(let [id,_] of Object.entries(old_data.user_data)){
            ids.push(id);
        }
    }
    for(let [id,user] of Object.entries(new_data.user_data)){
        if(!ids.includes(id)){
            promises.push(addUser(user));
        }
    }
    Promise.allSettled(promises).then(()=>{
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
function searchForMeet(change){
    for (let meet of change) {
        if (meet.meeting_code == meet_code) {
            return meet;
        }
    }
}
function addUser(id, user){
    return new Promise(re=>{
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
