function randn_bm() {
    let u = 0, v = 0;
    while(u === 0) u = Math.random(); //Converting [0,1) to (0,1)
    while(v === 0) v = Math.random();
    let num = Math.sqrt( -2.0 * Math.log( u ) ) * Math.cos( 2.0 * Math.PI * v );
    num = num / 10.0 + 0.5; // Translate to 0 -> 1
    if (num > 1 || num < 0) return randn_bm(); // resample between 0 and 1
    return num;
}

function sorter(a,b){
  if(a == b)
    return 0
  if(a < b)
    return 1
  else
    return -1
}


// set the dimensions and margins of the graph
var margin = {top: 10, right: 30, bottom: 30, left: 40},
    width = 460 - margin.left - margin.right,
    height = 400 - margin.top - margin.bottom;

// append the svg object to the body of the page
var svg = d3.select("#my-chart")
  .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
//  .append("g")
//    .attr("transform",
//          "translate(" + margin.left + "," + margin.top + ")");

const raw_data = new Array(100000).fill().map(() => randn_bm())
const scaler = d3.scaleLinear()
  .domain([d3.min(raw_data, d => d), d3.max(raw_data, d => d)])
  .range([1,30])
const scaled_data = raw_data.map(scaler)
const data = d3.nest()
  .key((d) => Math.ceil(d))
  .rollup((v) => v.length)
  .entries(scaled_data)
  .map(({key, value}) => ({key: parseInt(key), value: value}))

/*
 *  DEBUG UTILS
console.log("raw data", raw_data)
console.log("scaled", scaled_data)
console.log("data", data)
console.log("domainX", [d3.min(scaled_data, d => d), 1 + d3.max(scaled_data, d => d)])
console.log("domainY", [0, d3.max(data, d => d.value)])
*/

const scaleX = d3.scaleLinear()
    .domain([d3.min(scaled_data, d => d), 1 + d3.max(scaled_data, d => d)])
    .range([0, width])

const scaleY = d3.scaleLinear()
    .domain([0, d3.max(data, d => d.value)])
    .range([0, height])

const reversedScaleY = d3.scaleLinear()
    .domain([d3.max(data, d => d.value), 0])
    .range([0, height])



var palette = {
  red: "#D2222D",
  yellow: "#FFBF00",
  green: "#238823"
}
var max = d3.max(data, d => d.value)
var color = function (x) {
  /*
  if(x.value < max/3) {
    return palette.red
  }
  if (x.value < 2*max/3) {
    return palette.yellow
  }
  return palette.green
  */
  return "#145580"
}

function make_x_gridlines() {
    return d3.axisBottom(x)
        .ticks(5)
}

/*
 * GRID
 */

var xGrid = svg.append("g")
      .attr("class", "grid")
      .attr("transform", `translate(${margin.left}, ${height + margin.top})`)
      .call(d3.axisBottom(scaleX).ticks(5)
          .tickSize(-height)
          .tickFormat("")
      )
xGrid.select(".domain").remove()
xGrid.selectAll(".tick").style("stroke-dasharray", "2 2")
var yGrid = svg.append("g")
      .attr("class", "grid")
      .attr("transform", `translate(${margin.left}, ${margin.top})`)
      .call(d3.axisLeft(reversedScaleY).ticks(5)
          .tickSize(-width)
          .tickFormat("")
      )
yGrid.select(".domain").remove()
yGrid.selectAll(".tick").style("stroke-dasharray", "2 2")

/*
 * HISTOGRAM
 */

var rect = svg.selectAll("rect")
  .data(data)
  .join("rect")
  .attr("x", (d) => margin.right + scaleX((d.key)))
  .attr("width", (d) => scaleX(1 + (d.key)) - scaleX((d.key)))
  .attr("y", (d) => margin.top + height)
  .attr("height", 0)
  .attr("fill", color)
  .attr("fill-opacity", "0.4")

var path = svg.append("path")
  .datum(data.concat(data.map(({key, value}) => ({key: key+1, value: value}))).sort((a, b) => sorter((a.key), (b.key))))
  .attr("fill", "none")
  .attr("stroke", color)
  .attr("stroke-opacity", "0.6")
  .attr("stroke-linejoin", "arcs")
  .attr("stroke-width", 1.5)
  .attr("d", d3.line()
    .x(function(d) { return margin.right + scaleX((d.key))})
    .y(function(d) { return margin.top + height})
  )

/*
 * AXES
 * We draw axis last in order to be above everything
 */

var xAxis = svg.append("g")
    .attr("class", "x-axis")
    .attr("transform", `translate(${margin.left}, ${height + margin.top})`)
    .call(d3.axisBottom(scaleX));

var yAxis = svg.append("g")
    .attr("class", "y-axis")
    .attr("transform", `translate(${margin.left}, ${margin.top})`)
    .call(d3.axisLeft(reversedScaleY));

/*
 * DRAW DATA
 * Make data appears in transition
 */
path.transition()
  .duration(2000)
  .attr("d", d3.line()
    .x(function(d) { return margin.right + scaleX((d.key))})
    .y(function(d) { return margin.top + height - scaleY(d.value)})
  )
rect.transition()
  .duration(2000)
  .attr("y", (d) => margin.top + height - scaleY(d.value))
  .attr("height", (d) => scaleY(d.value))

