var SORT_ORDER_VALUE = 1;
var SORT_ORDER_NAME = 2;

var DATA_SOURCE_2010 = 1;
var DATA_SOURCE_2011 = 2;

var LABEL_WIDTH = 200;
var CHART_WIDTH = 620;
var BAR_HEIGHT = 20;

var DURATION_TIME = 1000;

var dataSource = DATA_SOURCE_2011;
var sortOrder = SORT_ORDER_NAME;

var loadedData;
var dataCount;
var maxValueEver;

var chart;
var chartScale;

var currentData;
var currentDataOrdering;

function toTitleCase(text) {
  return text.replace(/\w\S*/g, function(text) {
      return text.charAt(0).toUpperCase() + text.substr(1).toLowerCase();
  });
}

function calculateDataOrder() { 
  currentDataOrdering = [];
  for (var i = 0; i < currentData.length; i++) {
    currentDataOrdering.push(i);
  }

  switch (sortOrder) {
    case SORT_ORDER_VALUE:
        currentDataOrdering.sort(function(a, b) {
          return currentData[b] - currentData[a];
        });
        break;
    case SORT_ORDER_NAME:
        currentDataOrdering.sort(function(a, b) {
          return (currentDataLabels[a] > currentDataLabels[b]) ? 1 : ((currentDataLabels[b] > currentDataLabels[a]) ? -1 : 0);
        });
        break;
  }
}

function prepareData() {
  currentData = [];
  switch (dataSource) {
    case DATA_SOURCE_2010:
      for (var i in loadedData['offensesByYear']['2010']['part1']) {
        currentData.push(loadedData['offensesByYear']['2010']['part1'][i]);
      }
      for (var i in loadedData['offensesByYear']['2010']['part2']) {
        currentData.push(loadedData['offensesByYear']['2010']['part2'][i]);
      }
      break;
    case DATA_SOURCE_2011:
      for (var i in loadedData['offensesByYear']['2011']['part1']) {
        currentData.push(loadedData['offensesByYear']['2011']['part1'][i]);
      }
      for (var i in loadedData['offensesByYear']['2011']['part2']) {
        currentData.push(loadedData['offensesByYear']['2011']['part2'][i]);
      }
      break;
  }
}

function prepareChart() {
  dataCount = 0;
  for (var i in loadedData['offensesByYear']['2010']['part1']) {
    dataCount++;
  }
  for (var i in loadedData['offensesByYear']['2010']['part2']) {
    dataCount++;
  }
  dataCount += 2;

  chart = d3.select("#chart").append("svg")
      .attr("class", "chart")
      .attr("width", LABEL_WIDTH + CHART_WIDTH + 100)
      .attr("height", BAR_HEIGHT * dataCount);

  currentDataLabels = [];
  for (var i in loadedData['offensesByYear']['2010']['part1']) {
    currentDataLabels.push(toTitleCase(i));
  }
  for (var i in loadedData['offensesByYear']['2010']['part2']) {
    currentDataLabels.push(toTitleCase(i));
  }

  prepareData();
  calculateDataOrder();

  chartScale = d3.scale.linear()
      .domain([0, d3.max(currentData)])
      .range([0, CHART_WIDTH]);

  chart.selectAll("rect")
      .data(currentData)
      .enter().append("rect")
      .attr("x", LABEL_WIDTH)
      .attr("y", function(d, i) { return currentDataOrdering.indexOf(i) * BAR_HEIGHT; })
      .attr("width", chartScale)
      .attr("height", BAR_HEIGHT);

  chart.selectAll("text.label")
      .data(currentDataLabels)
      .enter().append("text")
      .attr("class", "label")
      .attr("x", 0)
      .attr("y", function(d, i) { return currentDataOrdering.indexOf(i) * BAR_HEIGHT - 5; })
      .attr("dx", LABEL_WIDTH - 3) // padding-right
      .attr("dy", BAR_HEIGHT) // vertical-align: middle
      .text(String);             

  chart.selectAll("text.value")
      .data(currentData)
      .enter().append("text")
      .attr("class", "value")
      .attr("x", chartScale)
      .attr("y", function(d, i) { return currentDataOrdering.indexOf(i) * BAR_HEIGHT - 5; })
      .attr("dx", LABEL_WIDTH + 3) // padding-right
      .attr("dy", BAR_HEIGHT) // vertical-align: middle
      .text(String);             
}

function changeDataSource(newDataSource) {
  dataSource = newDataSource;
  updateChart();
}

function changeSortOrder(newSortOrder) {
  sortOrder = newSortOrder;
  updateChart();
}

function updateChart() {
  prepareData();
  calculateDataOrder();

  chart.selectAll("rect")
      .data(currentData)
      .transition()
      .duration(DURATION_TIME)
      .attr("width", chartScale)
      .attr("y", function(d, i) { return currentDataOrdering.indexOf(i) * BAR_HEIGHT; });

  chart.selectAll("text.label")
      .data(currentData)
      .transition()
      .duration(DURATION_TIME)
      .attr("y", function(d, i) { return currentDataOrdering.indexOf(i) * BAR_HEIGHT - 5; })

  chart.selectAll("text.value")
      .data(currentData)
      .transition()
      .duration(DURATION_TIME)
      .attr("x", chartScale)
      .attr("y", function(d, i) { return currentDataOrdering.indexOf(i) * BAR_HEIGHT - 5; })
      .tween("text", function(d) {
        // TODO(mwichary): Must be a better way to do this.
        var i = d3.interpolateNumber(parseInt(this.textContent), d);
        return function(t) {
          this.textContent = parseInt(i(t));
        };
      });
}

function dataLoaded(error, data) {
  loadedData = data;
  prepareChart();
}

function loadData() {
  queue()
      .defer(d3.json, 'data.json')
      .await(dataLoaded);  
}

function main() {
  loadData();
}
