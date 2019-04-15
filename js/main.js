let fileName;

let fileList = ["S1E1_5_Writing",
    "S1E1_20_Writing",
    "S1E1_22_Writing",
    "S1E3_5_Writing",
    // "S1E3_20_Writing",
    "S1E3_22_Writing",
    // "S2E1_5_Reading",
    "S2E1_20_Writing",
    "S2E1_22_Writing",
    "S2E3_5_Writing",
    "S2E3_20_Writing",
    "S2E3_22_Writing"];

let initialDataset = "S1E1_5_Writing";
let data;
let sensors = ["BMI160Accelerometer", "LinearAcceleration", "BMI160Gyroscope"];

addDataOptions();

function addDataOptions() {
    let select = document.getElementById("datasetsSelect");
    for (let i = 0; i < fileList.length; i++) {
        let opt = fileList[i];
        let el = document.createElement("option");
        el.textContent = opt;
        el.value = opt;
        select.appendChild(el);
    }
    document.getElementById('datasetsSelect').value = initialDataset;
    fileName = document.getElementById("datasetsSelect").value;
    loadData();
}

function loadData() {
    fileName = "data/" + fileName + ".json";
    console.log(fileName);
    // var t0 = performance.now();
    // var t1 = performance.now();
    // console.log("Call to doSomething took " + (t1 - t0) + " milliseconds.");

    d3.json(fileName, function (error, inputData) {
        if (error) throw error;
        else {
            data = [];
            let normalizedData = normalizeData(inputData.data);

            console.log(inputData.data);
            let resampledData = resample(normalizedData, 20, 0.5);
            resampledData.forEach(chunk => {
                sensors.forEach(s => {
                    data.push(average(chunk.filter(d => d.sensor === s)));
                });
            });

            d3.selectAll(".myCheckbox").on("change", init);

            init();
            console.log(data);
        }
        d3.select('#loading').transition()
            .duration(200).remove();
    })
}

function loadNewData() {
    fileName = this.options[this.selectedIndex].text;
    let loading = d3.select('body').append('div')
        .attr('id', 'loading');
    loading.append('img')
        .attr('id', 'loading-image')
        .attr('src', 'images/fox.svg')
        .attr("height", "200")
        .attr("width", "200");
    loadData();
}

function resample(data, window_size, overlap) {
    let windowSize = window_size * 1000; // num of milisecond
    let [minTime, maxTime] = d3.extent(data, d => d.time);
    let chunksData = [];
    let resampledData = [];

    for (let i = minTime; i < maxTime; i += windowSize * (1 - overlap)) {
        var p = data.filter(d => {
            return ((d.time >= i) && (d.time < i + windowSize))
        });
        chunksData.push(p);

        if ((maxTime - i) <= 0.95 * windowSize) {
            // stop sliding windows when the space is too small,
            // get the last window then stop
            break;
        }
    }

    let length = chunksData.length;
    let [lastMin, lastMax] = d3.extent(chunksData[length - 1], d => d.time);

    if ((lastMax - lastMin) < windowSize / 2) {
        // small amount exceed range, add to prev one
        chunksData[length - 2] = chunksData[length - 2].concat(chunksData[length - 1]);
        chunksData.pop();
    }

    return chunksData;
}

function normalizeData(data) {
    sensors.forEach(sensorName => {
        let sensoryData = data.filter(record => record.sensor === sensorName);

        let xNorm = normFunction(d3.extent(sensoryData, d => parseFloat(d.x)), false);
        let yNorm = normFunction(d3.extent(sensoryData, d => parseFloat(d.y)), true);
        let zNorm = normFunction(d3.extent(sensoryData, d => parseFloat(d.z)), false);

        sensoryData.forEach(record => {
            record.x = xNorm(record.x);
            record.y = yNorm(record.y);
            record.z = zNorm(record.z);
        });
    });

    return data;
}

function normFunction([min, max], y) {
    var scale = d3.scaleLinear().domain([min, max])
        .range([-20, 20]);

    var scaleY = d3.scaleLinear().domain([min, max])
        .range([20, -20]);

    return y ? scaleY : scale;
}

function normalize(value, [min, max], y) {
    var scale = d3.scaleLinear().domain([min, max])
        .range([-20, 20]);

    var scaleY = d3.scaleLinear().domain([min, max])
        .range([20, -20]);

    return y ? scaleY(value) : scale(value);
}

function average(array) {
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
        id: array[0].id,
        sensor: array[0].sensor,
        x: sum.x / array.length,
        y: sum.y / array.length,
        z: sum.z / array.length
    }
}

// ______________________________________________________________________________
// __________________________________________________________________ PLOT ______


var origin = [580, 300], j = 10, scale = 20,
    scatter = [],
    yLine = [],
    xGrid = [], beta = 0, alpha = 0, key = function (d) {
        return d.id;
    },
    startAngle = Math.PI / 4;

var colorScheme = d3.scaleOrdinal(d3.schemeCategory10);

var color = function (d) {
    for (let i = 0; i < sensors.length; i++) {
        if (d.sensor === sensors[i]) {
            return colorScheme(i);
        }
    }
};
var mx, my, mouseX, mouseY;

var zoom = d3.zoom()
    .on("zoom", zoomed);

var svg = d3.select('svg')
    .call(d3.drag()
        .on('drag', dragged)
        .on('start', dragStart)
        .on('end', dragEnd))
    .append('g')
    .call(zoom)
;
var container = svg.append("g");

var grid3d = d3._3d()
    .shape('GRID', 20)
    .origin(origin)
    .rotateY(startAngle)
    .rotateX(-startAngle)
    .scale(scale);

var point3d = d3._3d()
    .x(function (d) {
        return d.x;
    })
    .y(function (d) {
        return d.y;
    })
    .z(function (d) {
        return d.z;
    })
    .origin(origin)
    .rotateY(startAngle)
    .rotateX(-startAngle)
    .scale(scale);

var yScale3d = d3._3d()
    .shape('LINE_STRIP')
    .origin(origin)
    .rotateY(startAngle)
    .rotateX(-startAngle)
    .scale(scale);

// var legend = svg.append("g")
//     .attr("id", "legend")
//     .attr("transform", "translate(10, 100)");
//
// legend.selectAll(".group")
//     .data(sensors)
//     .enter()
//     .append("g")
//     .attr("transform", (d,i) => "translate(0, "+ 100 + i * 30 +")")
//     .append("circle")
//     .attr("r", "10")
//     .attr("cx", 0)
//     .attr("cy", 0)
//     .attr("fill", (d, i) => colorScheme(i));
//
// d3.select("body").selectAll("text")
//     .data(sensors)
//     .enter()
//     .append("text")
//     .text(function(d) { return d; })
//     .append("input")
//     .attr("checked", true)
//     .attr("type", "checkbox")
//     .attr("id", function(d,i) { return i; })
//     .attr("onClick", "change(this)")
//     .attr("for", function(d,i) { return i; });

function processData(data, tt) {

    /* ----------- GRID ----------- */

    var xGrid = container.selectAll('path.grid').data(data[0], key);

    xGrid
        .enter()
        .append('path')
        .attr('class', '_3d grid')
        .merge(xGrid)
        .attr('stroke', 'black')
        .attr('stroke-width', 0.3)
        .attr('fill', function (d) {
            return d.ccw ? 'lightgrey' : '#717171';
        })
        .attr('fill-opacity', 0.9)
        .attr('d', grid3d.draw);

    xGrid.exit().remove();

    /* ----------- POINTS ----------- */

    var points = container.selectAll('circle').data(data[1], key);

    points
        .enter()
        .append('circle')
        .attr('class', '_3d')
        .attr('opacity', 0)
        .attr('cx', posPointX)
        .attr('cy', posPointY)
        .on("mouseover", (d) => {
            div.transition()
                .duration(200)
                .style("opacity", 1);

            div.html("d: " + d.id +
                "<br> x: " + d.x +
                "<br> y: " + d.y +
                "<br> z: " + d.z)
                .style("left", (d3.event.pageX) + 20 + "px")
                .style("top", (d3.event.pageY) + "px");
        })
        .on("mouseleave", () => {
            div.transition()
                .duration(200)
                .style("opacity", 0);
        })
        .merge(points)
        .transition().duration(tt)
        .attr('r', 2)
        .attr('stroke', function (d) {
            return d3.color(color(d)).darker(2);
        })
        .attr('fill', function (d) {
            return color(d);
        })
        .attr('opacity', 1)
        .attr('cx', posPointX)
        .attr('cy', posPointY);

    points.exit().remove();

    /* ----------- y-Scale ----------- */

    var yScale = container.selectAll('path.yScale').data(data[2]);

    yScale
        .enter()
        .append('path')
        .attr('class', '_3d yScale')
        .merge(yScale)
        .attr('stroke', 'black')
        .attr('stroke-width', .5)
        .attr('d', yScale3d.draw);

    yScale.exit().remove();

    /* ----------- y-Scale Text ----------- */

    var yText = container.selectAll('text.yText').data(data[2][0]);

    yText
        .enter()
        .append('text')
        .attr('class', '_3d yText')
        .attr('dx', '.3em')
        .merge(yText)
        .each(function (d) {
            d.centroid = {x: d.rotated.x, y: d.rotated.y, z: d.rotated.z};
        })
        .attr('x', function (d) {
            return d.projected.x;
        })
        .attr('y', function (d) {
            return d.projected.y;
        })
        .text(function (d) {
            return d[1] <= 0 ? d[1] : '';
        });

    yText.exit().remove();

    d3.selectAll('._3d').sort(d3._3d().sort);
}

function posPointX(d) {
    return d.projected.x;
}

function posPointY(d) {
    return d.projected.y;
}

function init() {
    scatter = [];
    xGrid = [];
    yLine = [];
    sensors.forEach(sensor => {
        if (document.getElementById(sensor).checked === true) {
            scatter = scatter.concat(data.filter(d => d.sensor === sensor));
        }
    });

    for (var z = -j; z < j; z++) {
        for (var x = -j; x < j; x++) {
            xGrid.push([x, 1, z]);
        }
    }

    d3.range(-1, 11, 1).forEach(function (d) {
        yLine.push([-j, -d, -j]);
    });

    var cdata = [
        grid3d(xGrid),
        point3d(scatter),
        yScale3d([yLine])
    ];

    processData(cdata, 600);
}

// ------------------------- Behavior -----------------------------
function dragStart() {
    mx = d3.event.x;
    my = d3.event.y;
}

function dragged() {
    mouseX = mouseX || 0;
    mouseY = mouseY || 0;
    beta = (d3.event.x - mx + mouseX) * Math.PI / 230;
    alpha = (d3.event.y - my + mouseY) * Math.PI / 230 * (-1);
    var data = [
        grid3d.rotateY(beta + startAngle).rotateX(alpha - startAngle)(xGrid),
        point3d.rotateY(beta + startAngle).rotateX(alpha - startAngle)(scatter),
        yScale3d.rotateY(beta + startAngle).rotateX(alpha - startAngle)([yLine]),
    ];
    processData(data, 0);
}

function dragEnd() {
    mouseX = d3.event.x - mx + mouseX;
    mouseY = d3.event.y - my + mouseY;
}

function zoomed() {
    container.attr("transform", d3.event.transform);
}
