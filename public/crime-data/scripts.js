var SORT_ORDER_VALUE = 1;
var SORT_ORDER_NAME = 2;

var DATA_SOURCE_2010 = 1;
var DATA_SOURCE_2011 = 2;

var DATA_TYPE_OFFENSES = 1;
var DATA_TYPE_ARRESTS = 2;

var LABEL_WIDTH = 200;
var CHART_WIDTH = 620;
var BAR_HEIGHT = 22;
var BAR_PADDING = 2;

var DURATION_TIME = 500;

var dataSource = DATA_SOURCE_2011;
var sortOrder = SORT_ORDER_NAME;
var dataType = DATA_TYPE_OFFENSES;

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
  switch (dataType) {
    case DATA_TYPE_ARRESTS:
      var dataTypeField = 'arrestOffensesByYear';
      break;
    case DATA_TYPE_OFFENSES:
      var dataTypeField = 'offensesByYear';
      break;
  }
  switch (dataSource) {
    case DATA_SOURCE_2010:
      var dataSourceField = '2010';
      break;
    case DATA_SOURCE_2011:
      var dataSourceField = '2011';
      break;
  }

  currentData = [];
  for (var i in loadedData[dataTypeField][dataSourceField]['part1']) {
    currentData.push(loadedData[dataTypeField][dataSourceField]['part1'][i]);
  }
  for (var i in loadedData[dataTypeField][dataSourceField]['part2']) {
    currentData.push(loadedData[dataTypeField][dataSourceField]['part2'][i]);
  }
}

function findDataCount() {
  dataCount = 0;
  for (var i in loadedData['offensesByYear']['2010']['part1']) {
    dataCount++;
  }
  for (var i in loadedData['offensesByYear']['2010']['part2']) {
    dataCount++;
  }
  dataCount += 2;    
}

function findAbsoluteMaximum() {
  absoluteMaximum = 0;
  for (var i in loadedData) {
    for (var j in loadedData[i]) {
      for (var k in loadedData[i][j]) {
        for (var l in loadedData[i][j][k]) {
          var val = loadedData[i][j][k][l];

          if (val > absoluteMaximum) {
            absoluteMaximum = val;
          }
        }
      }
    }
  }
}

function analyzeData() {
  findDataCount();
  findAbsoluteMaximum();
}

function createChart() {
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
      .domain([0, absoluteMaximum])
      .range([0, CHART_WIDTH]);

  chart.selectAll("rect")
      .data(currentData)
      .enter().append("rect")
      .attr("x", LABEL_WIDTH)
      .attr("y", function(d, i) { return currentDataOrdering.indexOf(i) * (BAR_HEIGHT + BAR_PADDING); })
      .attr("width", chartScale)
      .attr("height", BAR_HEIGHT);

  chart.selectAll("text.label")
      .data(currentDataLabels)
      .enter().append("text")
      .attr("class", "label")
      .attr("x", 0)
      .attr("y", function(d, i) { return currentDataOrdering.indexOf(i) * (BAR_HEIGHT + BAR_PADDING) - 5; })
      .attr("dx", LABEL_WIDTH - 3) // padding-right
      .attr("dy", BAR_HEIGHT) // vertical-align: middle
      .text(String);             

  chart.selectAll("text.value")
      .data(currentData)
      .enter().append("text")
      .attr("class", "value")
      .attr("x", chartScale)
      .attr("y", function(d, i) { return currentDataOrdering.indexOf(i) * (BAR_HEIGHT + BAR_PADDING) - 5; })
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

function changeDataType(newDataType) {
  dataType = newDataType;
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
      .attr("y", function(d, i) { return currentDataOrdering.indexOf(i) * (BAR_HEIGHT + BAR_PADDING); });

  chart.selectAll("text.label")
      .data(currentData)
      .transition()
      .duration(DURATION_TIME)
      .attr("y", function(d, i) { return currentDataOrdering.indexOf(i) * (BAR_HEIGHT + BAR_PADDING) - 5; })

  chart.selectAll("text.value")
      .data(currentData)
      .transition()
      .duration(DURATION_TIME)
      .attr("x", chartScale)
      .attr("y", function(d, i) { return currentDataOrdering.indexOf(i) * (BAR_HEIGHT + BAR_PADDING) - 5; })
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
  analyzeData();
  createChart();
}

function loadData() {
  queue()
      .defer(d3.json, 'data.json')
      .await(dataLoaded);  
}

function main() {
  loadData();
}
