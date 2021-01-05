let STR = {
    cur_meetings: "cur_meetings",
    users: "users"
}
//TODO: deal with page refresh... should refresh data or something

Chart.plugins.register({ //sorting
    beforeUpdate: function(chart) {
    if (chart.options.sort) {
    console.log(chart.data.datasets[0]);
      let dataArray = chart.data.datasets[0].data.slice();
      
      console.log(dataArray);
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
    
      meta.data.forEach((a, i) => {
        newMeta[dataIndexes[i]] = a;
        newLabels[dataIndexes[i]] = chart.data.labels[i];
      });
    
      meta.data = newMeta;
      chart.data.datasets[0].data = dataArray;
      chart.data.labels = newLabels;
      }
      }
    });

let user_database, cur_meeting, meet_code; //these are the variables that contain the current meeting data (they're updated automatically and updateSpeakerData() is called everytime there's an update.)
var timeGraph_obj;

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
    is_speaking: Mayeb relevant
    speaking_time: yes  
}

Good luck! :)
*/
window.onload = () => {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        chrome.tabs.sendMessage(tabs[0].id, { type: "get_meeting_data" }, function (data) {

            if (chrome.runtime.lastError) {
                $("#test").html("You aren't in a call yet!");

            } else {
                user_database = data.user_database;
                cur_meeting = data.cur_meeting;
                console.log(data);
                createChart();
                if (!user_database || !cur_meeting) {
                    $("#test").html("No data yet!");
                } else {
                    meet_code = cur_meeting.meeting_code;
                    updateSpeakerData();
                }
            };
        })
    });

    let page = $(".tab")[0].innerHTML;

    $(".tab").on( "mouseover",function (){
        $(this).addClass("selected");
    });
    $(".tab").on( "mouseout",function (){
        if(page!=$(this).html()){
            $(this).removeClass("selected");
        }
    });
    $(".tab").click(function(){
        $(".tab").removeClass("selected");
        $(this).addClass("selected");
        page = $(this).html();
        
    })
}
function updateSpeakerData() {
    let str = "";
    for(let [id,user_data] of Object.entries(cur_meeting.user_data)){
        str+=user_database[id].NAME+": "+user_data.speaking_time+"<br>"; 
        timeGraph_obj.data.datasets[0].data[timeGraph_obj.data.labels.indexOf(user_database[id].NAME)] = user_data.speaking_time
    }
    $("#test").html(str);
    timeGraph_obj.update();
}

function createChart(){
    let label_set = [];
    let data_set = [];
    let color_set = [];
    const fac = new FastAverageColor()
    for(let [id, user_data] of Object.entries(cur_meeting.user_data)){
        label_set.push(user_database[id].NAME);
        data_set.push(user_data.speaking_time);
        fac.getColorAsync(user_database[id].IMG_ID)
        .then(color => {
            color_set.push(color.hex);
        })
        .catch(e => {
            console.log(e);
        });
    }
    // the getColorAsync function is necessary to get the average color of an unloaded image, but the way it is right now results in color_set being an empty set when the graph is made
    var ctx = document.getElementById('timeGraph').getContext('2d');
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
        options: {
            scales: {
                yAxes: [{
                    ticks: {
                        beginAtZero: true
                    }
                }]
            }
        }
    });
    timeGraph_obj.options.sort = true;
    timeGraph_obj.update();
    timeGraph_obj.options.sort = false;
}
chrome.storage.onChanged.addListener(function (changes) {
    for (var key in changes) {
        var change = changes[key];
        if (key === STR.cur_meetings) {

            for (let meet of change.newValue) {
                if (meet.meeting_code == meet_code) {
                    cur_meeting = meet;
                    break;
                }
            }
            updateSpeakerData();
        } else if (key === STR.users) {
            user_database = changes.newValue;
        }

    }
});
