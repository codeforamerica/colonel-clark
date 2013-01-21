var SORT_ORDER_VALUE = 1;
var SORT_ORDER_NAME = 2;

var DATA_SOURCE_2010 = 1;
var DATA_SOURCE_2011 = 2;
var DATA_SOURCE_2010_VS_2011 = 3;

var DATA_TYPE_OFFENSES = 1;
var DATA_TYPE_ARRESTS = 2;

var LABEL_WIDTH = 200;
var VALUE_WIDTH = 50;
var BAR_HEIGHT = 22;
var BAR_PADDING = 2;
var LABEL_OFFSET = 5;

var DURATION_TIME = 500;

var dataSource = DATA_SOURCE_2011;
var sortOrder = SORT_ORDER_VALUE;
var dataType = DATA_TYPE_ARRESTS;
var chartCount = 2;

var loadedData;
var dataCount;
var absoluteMaximum;

var globalWidth;
var chartWidth;

var chart;
var chartScale;

var currentData;
var currentSecondaryData;
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

function getData(dataType, dataSource) {
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

  var data = [];
  for (var i in loadedData[dataTypeField][dataSourceField]['part1']) {
    data.push(loadedData[dataTypeField][dataSourceField]['part1'][i]);
  }
  for (var i in loadedData[dataTypeField][dataSourceField]['part2']) {
    data.push(loadedData[dataTypeField][dataSourceField]['part2'][i]);
  }
  return data;
}

function prepareData() {
  if (dataSource == DATA_SOURCE_2010_VS_2011) {
    currentData = getData(dataType, DATA_SOURCE_2011);
    currentSecondaryData = getData(dataType, DATA_SOURCE_2010);
    chartCount = 2;
  } else {
    currentData = getData(dataType, dataSource);
    currentSecondaryData = currentData;
    chartCount = 1;
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

function calculateChartWidth() {
  globalWidth = document.querySelector('#chart').offsetWidth;

  switch (chartCount) {
    case 1:
      chartWidth = globalWidth - LABEL_WIDTH - VALUE_WIDTH;
      break;
    case 2:
      chartWidth = (globalWidth - LABEL_WIDTH - VALUE_WIDTH * 2) / 2;
      break;
  }

  chartScale = d3.scale.linear()
      .domain([0, absoluteMaximum])
      .range([0, chartWidth]);
}

function createChart() {
  calculateChartWidth();

  chart = d3.select("#chart").append("svg")
      .attr("class", "chart")
      .attr("width", globalWidth)
      .attr("height", (BAR_HEIGHT + BAR_PADDING) * dataCount);

  currentDataLabels = [];
  for (var i in loadedData['offensesByYear']['2010']['part1']) {
    currentDataLabels.push(toTitleCase(i));
  }
  for (var i in loadedData['offensesByYear']['2010']['part2']) {
    currentDataLabels.push(toTitleCase(i));
  }

  prepareData();
  calculateDataOrder();

  // Label

  chart.selectAll("text.label")
      .data(currentDataLabels)
      .enter().append("text")
      .attr("class", "label")
      .attr("y", function(d, i) { return currentDataOrdering.indexOf(i) * (BAR_HEIGHT + BAR_PADDING) - 5; })
      .attr("dy", BAR_HEIGHT)
      .text(String);             

  // Chart

  for (chartNo = 1; chartNo <= 2; chartNo++) {
    var data = (chartNo == 2) ? currentData : currentSecondaryData;

    chart.selectAll("rect.rect.chart" + chartNo)
        .data(data)
        .enter().append("rect")
        .attr("class", "rect chart" + chartNo)
        .attr("height", BAR_HEIGHT);

    chart.selectAll("text.value.chart" + chartNo)
        .data(data)
        .enter().append("text")
        .attr("class", "value chart" + chartNo)
        .attr("dy", BAR_HEIGHT)
        .text(String);             
  }
}

function changeDataSource(newDataSource) {
  dataSource = newDataSource;
  updateChart(true);
}

function changeSortOrder(newSortOrder) {
  sortOrder = newSortOrder;
  updateChart(true);
}

function changeDataType(newDataType) {
  dataType = newDataType;
  updateChart(true);
}

function updateChart(animate) {
  prepareData();
  calculateChartWidth();
  calculateDataOrder();

  var time = animate ? DURATION_TIME : 0;

  // Label

  switch (chartCount) {
    case 1:
      var x = 0;
      break;
    case 2:
      var x = chartWidth + VALUE_WIDTH;
      break;
  }


  chart.selectAll("text.label")
      .data(currentData)
      .transition()
      .duration(time)
      .attr("x", x)
      .attr("y", function(d, i) { return currentDataOrdering.indexOf(i) * (BAR_HEIGHT + BAR_PADDING) - 5; })
      .attr("dx", LABEL_WIDTH - LABEL_OFFSET);      

  // Chart

  for (chartNo = 1; chartNo <= 2; chartNo++) {
    var data = (chartNo == 2) ? currentData : currentSecondaryData;

    switch (chartCount) {
      case 1:
        var x = (chartNo == 1) ? (-chartWidth - LABEL_WIDTH) : LABEL_WIDTH;
        break;
      case 2:
        var x = (chartNo == 1) ? 0 : chartWidth + LABEL_WIDTH + VALUE_WIDTH;
        break;
    }

    chart.selectAll("rect.rect.chart" + chartNo)
        .data(data)
        .transition()
        .duration(time)
        .attr("width", chartScale)
        .attr("x", function(d) { 
          if (chartNo == 1) {
            return x + VALUE_WIDTH + chartWidth - chartScale(d); 
          } else {
            return x;
          }
        })
        .attr("y", function(d, i) { return currentDataOrdering.indexOf(i) * (BAR_HEIGHT + BAR_PADDING); });

    chart.selectAll("text.value.chart" + chartNo)
        .data(data)
        .transition()
        .duration(time)
        .attr("x", function(d) {
          if (chartNo == 1) {
            return x + chartWidth - chartScale(d);
          } else {
            return x + chartScale(d);
          }
        })
        .attr("y", function(d, i) { return currentDataOrdering.indexOf(i) * (BAR_HEIGHT + BAR_PADDING) - 5; })
        .attr("dx", LABEL_OFFSET)
        .tween("text", function(d) {
          // TODO(mwichary): Must be a better way to do this.
          var i = d3.interpolateNumber(parseInt(this.textContent), d);
          return function(t) {
            this.textContent = parseInt(i(t));
          };
        });
  }
}

function onResize() {
  calculateChartWidth();
  updateChart(false);
}

function dataLoaded(error, data) {
  loadedData = data;

  window.addEventListener('resize', onResize, false);

  analyzeData();
  createChart();
  updateChart(false);
}

function loadData() {
  queue()
      .defer(d3.json, 'data.json')
      .await(dataLoaded);  
}

function main() {
  loadData();
}
