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
    let fileName1 = "data/"+fileName+".csv";
    console.log(fileName);
    d3.csv(fileName1, function (error, data) {

        let task = data[1].task;
        let devideID = data[1].id;
        let date = new Date(Date.parse(data[1].time)).toLocaleDateString();
        let obj = {};

        data.forEach(d => {
            d.id = d[""];
            d.time = Date.parse(d.time);
            d.sensor = d.sensor.replace(" ","");
            delete d.task;
            delete d[""];
        });

        // let nested = d3.nest()
        //     .key(d => d.sensor)
        //     .entries(data);
        //
        // nested.forEach(sensor => {
        //     sensor.values.forEach(d => {
        //         d.stamp = d[""];
        //         d.time = Date.parse(d.time);
        //         delete d.task;
        //         delete d.id;
        //         delete d[""];
        //         delete d.sensor;
        //         // delete d.time;
        //     })
        // });

        obj.task = task.split(" ")[0];
        obj.devideID = devideID;
        obj.date = date;
        obj.data = data;
        // obj[nested[0].key.replace(" ", "")] = nested[0].values;
        // obj[nested[1].key.replace(" ", "")] = nested[1].values;
        // obj[nested[2].key.replace(" ", "")] = nested[2].values;
        console.log(obj);
        d3.select('#loading').remove();

    });
    // let fileName2 = "data/"+fileName+".json";
    // d3.json(fileName2, function (error, data) {
    //     console.log(data);
    // })
}

function loadNewData() {
    fileName = this.options[this.selectedIndex].text;
    loadData();
}