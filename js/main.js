let fileName;

let fileList = ["S1E1_5_Writing",
    "S1E1_20_Writing",
    "S1E1_22_Writing",
    "S1E3_5_Writing",
    "S1E3_20_Writing",
    "S1E3_22_Writing",
    "S2E1_5_Reading",
    "S2E1_20_Writing",
    "S2E1_22_Writing",
    "S2E3_5_Writing",
    "S2E3_20_Writing",
    "S2E3_22_Writing"];

let initialDataset = "S1E1_5_Writing";

addDataOptions();
function addDataOptions() {
    let select = document.getElementById("datasetsSelect");
    for(let i = 0; i < fileList.length; i++) {
        let opt = fileList[i];
        let el = document.createElement("option");
        el.textContent = opt;
        el.value = opt;
        select.appendChild(el);
    }
    document.getElementById('datasetsSelect').value = initialDataset;  //************************************************
    fileName = document.getElementById("datasetsSelect").value;
    loadData();
}
function loadData(){
    fileName = "data/"+fileName+".json";
    console.log(fileName);
    // var t0 = performance.now();
    // var t1 = performance.now();
    // console.log("Call to doSomething took " + (t1 - t0) + " milliseconds.");

    d3.json(fileName, function (error, inputData) {
        if (error) throw error;
        else {
            resample(inputData.data, 30, 0.5);
        }
    })
}

function loadNewData() {
    fileName = this.options[this.selectedIndex].text;
    loadData();
}

function resample(data, window_size, overlap){
    let windowSize = window_size * 1000; // num of milisecond

    let [minTime, maxTime] = d3.extent(data, d => d.time);
    let chunksData = [];
    let resampledData = [];

    for (let i = minTime; i < maxTime; i += windowSize*(1-overlap)){
        var p = data.filter(d => {
            return ((d.time >= i) && (d.time < i+windowSize))
        });
        chunksData.push(p);

        if ((maxTime - i) <= 0.95 * windowSize){
            // stop sliding windows when the space is too small,
            // get the last window then stop
            break;
        }
    }

    let length = chunksData.length;
    let [lastMin, lastMax] = d3.extent(chunksData[length - 1], d => d.time);

    if ((lastMax -lastMin) < windowSize/2){
        // small amount exceed range, add to prev one
        chunksData[length - 2] = chunksData[length - 2].concat(chunksData[length - 1]);
        chunksData.pop();
    }

    chunksData.forEach((chunk,i) => {
        resampledData[i] = {};

        let nested = d3.nest()
            .key(d => d.sensor)
            .entries(chunk);

        nested.forEach(d => {
            resampledData[i][d.key] = average(d.values);
        })

    });

    console.log(chunksData);
    console.log(resampledData);

    // chunksData.forEach(d => console.log(d[d.length-1].time - d[0].time));
    d3.select('#loading').remove();

}

function average(array){
    let sum = {
        x: 0,
        y: 0,
        z: 0
    };
    array.forEach(d => {
        sum.x += parseFloat(d.x);
        sum.y += parseFloat(d.y);
        sum.z += parseFloat(d.z);
    });
    return {
        x: sum.x / array.length,
        y: sum.y / array.length,
        z: sum.z / array.length
    }
}