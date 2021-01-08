let STR = {
    cur_meetings: "cur_meetings",
    users: "users"
}
//TODO: deal with page refresh... should refresh data or something

let user_database, cur_meeting, meet_code; //these are the variables that contain the current meeting data (they're updated automatically and updateSpeakerData() is called everytime there's an update.)
let timeGraph_obj;
let page;
let header_names = {
    'D':"Debug",
    'C': "Current Meeting",
    "H": "Meeting History",
    "A": "Analysis"
}
Chart.plugins.register({ //sorting
    beforeUpdate: function (chart) {
        if (chart.options.sort) {
            let dataArray = chart.data.datasets[0].data.slice();

            let dataIndexes = dataArray.map((d, i) => i);
            dataIndexes.sort((a, b) => {
                return dataArray[a] - dataArray[b];
            });

            // sort data array as well
            dataArray.sort((a, b) => a - b);

            // At this point dataIndexes is sorted by value of the data, so we 
            //know how the indexes map to each other
            let meta = chart.getDatasetMeta(0);
            let newMeta = [];
            let labels = chart.data.labels;
            let newLabels = [];
            let newColors = [];

            meta.data.forEach((a, i) => {
                newMeta[dataIndexes[i]] = a;
                newLabels[dataIndexes[i]] = chart.data.labels[i];
                newColors[dataIndexes[i]] = chart.data.datasets[0].backgroundColor[i];
            });

            meta.data = newMeta;
            chart.data.datasets[0].data = dataArray;
            chart.data.labels = newLabels;
            chart.data.datasets[0].backgroundColor = newColors;
            chart.data.datasets[0].borderColor = newColors;
        }
    }
});
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

Good luck! :)
*/
window.onload = () => {
    chrome.storage.onChanged.addListener(function (changes) {
        for (var key in changes) {
            var cur_change = changes[key].newValue;
            if (key === STR.cur_meetings) {
    
                for (let meet of cur_change) {
                    if (meet.meeting_code == meet_code) {
                        cur_meeting = meet;
                        break;
                    }
                }
                
            } else if (key === STR.users) {
                user_database = cur_change;
                console.log("updated user_database to ",user_database);
            }
        }
        updateSpeakerData();
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
                    createChart();
                    updateSpeakerData();

                }
            };
        })
    });

    $(".tab").click(function () {
        page = $(this).attr("ref");

        $("#tab-container-heading").html(header_names[page]);
        $(".tab-container").css("display","none");
        $(".tab").removeClass("selected");

        $(".tab-container[ref="+page+"]").css("display","block");
        $(this).addClass("selected");
    });
    $(".tab[ref='C']").click();

}

function updateSpeakerData() {
    if(!timeGraph_obj){
        return;
    }
    let str = "";
    let label_set = [];
    let data_set = [];
    let color_set = [];
    let promises = [];
    const fac = new FastAverageColor();
    for (let [id, user_data] of Object.entries(cur_meeting.user_data)) {
        str += user_database[id].NAME + ": " + user_data.speaking_time + "<br>";
        label_set.push(user_database[id].NAME);
        data_set.push(user_data.speaking_time);
        let p = fac.getColorAsync(user_database[id].IMG_ID)
            .then(color => {
                color_set.push(color.hex);
            })
            .catch(e => {
                console.log(e);
            });
        promises.push(p);
    }
    $("#test").html(str);
    Promise.allSettled(promises).then(()=>{
        console.log(timeGraph_obj.data);
        timeGraph_obj.data.datasets[0].data = data_set;
        timeGraph_obj.data.datasets[0].backgroundColor = color_set;
        timeGraph_obj.data.labels = label_set;
        timeGraph_obj.data.datasets[0].borderColor = color_set;
        console.log(timeGraph_obj.data);
        timeGraph_obj.options.sort = true;
        timeGraph_obj.update();
        timeGraph_obj.options.sort = false;
    }
    );
}

function createChart() {
    let label_set = [];
    let data_set = [];
    let color_set = [];
    let promises = [];
    const fac = new FastAverageColor();
    for (let [id, user_data] of Object.entries(cur_meeting.user_data)) {
        label_set.push(user_database[id].NAME);
        data_set.push(user_data.speaking_time);
        let p = fac.getColorAsync(user_database[id].IMG_ID)
            .then(color => {
                color_set.push(color.hex);
            })
            .catch(e => {
                console.log(e);
            });


        promises.push(p);
    }
    Promise.allSettled(promises).then(()=>{
        var ctx = document.getElementById('timeGraph').getContext('2d');
        let options = {
            scales: {
                xAxes: [{
                    display: true,
                    ticks: {
                        beginAtZero: true,
                    }
                }]
            },
            animation: {
                duration: 0
            }
        }
        timeGraph_obj = new Chart(ctx, {
            type: 'horizontalBar',
            data: {
                labels: label_set,
                datasets: [{
                    label: '# of seconds spoken per person',
                    data: data_set,
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
