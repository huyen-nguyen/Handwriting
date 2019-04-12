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

let initialDataset = "S1E3_5_Writing";

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
    d3.json(fileName, function (error, data) {
        var device = d3.keys(data).filter(d => (d !== "id") && (d !== "task"));
        device.forEach(dev => {
            data[dev].forEach(d => {
                d.time = Date.parse(d.time);
            })
        });
        console.log(data);





        // var t1 = performance.now();
        // console.log("Call to doSomething took " + (t1 - t0) + " milliseconds.");
    })
}

function loadNewData() {
    fileName = this.options[this.selectedIndex].text;
    loadData();
}

function resample(data, windowSize){
    let wSize = windowSize * 1000; // num of milisecond

    let resampledData = [];


}