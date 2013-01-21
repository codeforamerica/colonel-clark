var SORT_ORDER_VALUE = 'sort-order-value';
var SORT_ORDER_NAME = 'sort-order-name';
var SORT_ORDER_PART_NAME = 'sort-order-part-name';
var SORT_ORDER_PART_VALUE = 'sort-order-part-value';
var SORT_ORDER_PERCENTAGE_CHANGE = 'sort-order-percentage-change';

var DATA_SOURCE_2010 = 'data-source-2010';
var DATA_SOURCE_2011 = 'data-source-2011';
var DATA_SOURCE_2010_VS_2011 = 'data-source-2010-vs-2011';

var DATA_TYPE_OFFENSES = 'data-type-offenses';
var DATA_TYPE_ARRESTS = 'data-type-arrests';
var DATA_TYPE_OFFENSES_VS_ARRESTS = 'data-type-offenses-vs-arrests';

var DATA_NOT_AVAILABLE = -1;

var LABEL_WIDTH = 200;
var VALUE_WIDTH = 120;
var BAR_HEIGHT = 22;
var BAR_PADDING = 3;
var LABEL_OFFSET = 10;

var HEADER_HEIGHT = 150;
var PIE_CHART_Y = 50;
var PIE_CHART_RADIUS = 30;

var TICK_COUNT = 10;

var DURATION_TIME = 500;

var dataSource = DATA_SOURCE_2011;
var sortOrder = SORT_ORDER_VALUE;
var dataType = DATA_TYPE_OFFENSES;
var chartCount = 2;

var loadedData;
var absoluteMaximum;
var dataLabels;
var simpleDataLabels;

var globalWidth;
var chartWidth;

var chart;
var pieChart;
var chartScale;
var chartScaleSimple;

var currentData;
var currentSecondaryData;
var currentDataOrdering;

function toTitleCase(text) {
  return text.replace(/\w\S*/g, function(text) {
      return text.charAt(0).toUpperCase() + text.substr(1).toLowerCase();
  });
}

function formatValue(val, i, chartNo) {
  var text;
  if (val == DATA_NOT_AVAILABLE) {
    text = 'n/a'; 
  } else {
    text = val.toString().replace(/\d(?=(?:\d{3})+(?!\d))/g, '$&,');
  }

  if ((chartCount == 2) && (chartNo == 2)) {
    if ((val != -1) && (currentSecondaryData[i] != -1)) {
      var perc = val / currentSecondaryData[i] * 100;

      if (perc == Number.POSITIVE_INFINITY) {
        text += ' (+∞)';
      } else if (perc == Number.NEGATIVE_INFINITY) {
        text += ' (–∞)';
      } else if (perc > 100) {
        text += ' (+' + (perc - 100).toFixed(1) + '%)';
      } else if (perc < 100) {
        text += ' (–' + (100 - perc).toFixed(1) + '%)';
      }
    }
  }

  return text;
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
    case SORT_ORDER_PART_VALUE:
      currentDataOrdering.sort(function(a, b) {
        var partA = dataLabels[simpleDataLabels[a]].part;
        var partB = dataLabels[simpleDataLabels[b]].part;

        return partA.localeCompare(partB) || 
            (currentData[b] - currentData[a]);
      });
      break;
    case SORT_ORDER_NAME:
      currentDataOrdering.sort(function(a, b) {
        return (simpleDataLabels[a] > simpleDataLabels[b]) ? 1 : ((simpleDataLabels[b] > simpleDataLabels[a]) ? -1 : 0);
      });
      break;
    case SORT_ORDER_PART_NAME:
      currentDataOrdering.sort(function(a, b) {
        var partA = dataLabels[simpleDataLabels[a]].part;
        var partB = dataLabels[simpleDataLabels[b]].part;

        return partA.localeCompare(partB) || 
          ((simpleDataLabels[a] > simpleDataLabels[b]) ? 1 : ((simpleDataLabels[b] > simpleDataLabels[a]) ? -1 : 0));
      });
      break;
    case SORT_ORDER_PERCENTAGE_CHANGE:
      currentDataOrdering.sort(function(a, b) {
        var percA = currentData[a] / currentSecondaryData[a];
        var percB = currentData[b] / currentSecondaryData[b];
        return percB - percA;
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
  for (var i in dataLabels) {
    var label = dataLabels[i];

    data.push(loadedData[dataTypeField][dataSourceField][label.part][label.label]);
  }
  return data;
}

function prepareData() {
  if (dataSource == DATA_SOURCE_2010_VS_2011) {
    currentData = getData(dataType, DATA_SOURCE_2011);
    currentSecondaryData = getData(dataType, DATA_SOURCE_2010);
    chartCount = 2;
  } else if (dataType == DATA_TYPE_OFFENSES_VS_ARRESTS) {
    currentData = getData(DATA_TYPE_ARRESTS, dataSource);
    currentSecondaryData = getData(DATA_TYPE_OFFENSES, dataSource);
    chartCount = 2;
  } else {
    currentData = getData(dataType, dataSource);
    if (!currentSecondaryData) {
      currentSecondaryData = currentData;
    }
    chartCount = 1;
  }
}

function fillInTheBlanks() {
  var dataTypes = ['offensesByYear', 'arrestOffensesByYear'];
  var dataSources = ['2010', '2011'];

  for (var j in dataTypes) {
    for (var k in dataSources) {
      for (var label in dataLabels) {
        if (typeof loadedData[dataTypes[j]][dataSources[k]][dataLabels[label].part][label] == 'undefined') {
          loadedData[dataTypes[j]][dataSources[k]][dataLabels[label].part][label] = DATA_NOT_AVAILABLE;
        }
      }
    }
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
  putTogetherLabels();
  fillInTheBlanks();
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

  chartScaleSimple = d3.scale.linear()
      .domain([0, absoluteMaximum])
      .range([0, chartWidth]);

  chartScale = function(d) {
    if (d == DATA_NOT_AVAILABLE) {
      d = 0;
    }
    return chartScaleSimple(d);
  }
}

function putTogetherLabels() {
  dataLabels = {};

  var dataTypes = ['offensesByYear', 'arrestOffensesByYear'];
  var dataSources = ['2010', '2011'];
  var parts = ['part1', 'part2'];

  for (var j in dataTypes) {
    for (var k in dataSources) {
      for (var l in parts) {
        for (var label in loadedData[dataTypes[j]][dataSources[k]][parts[l]]) {
          dataLabels[label] = { label: label, part: parts[l] };
        }
      }
    }
  }

  simpleDataLabels = [];

  for (var label in dataLabels) {
    simpleDataLabels.push(label);
  }
}

function createChart() {
  calculateChartWidth();

  chart = d3.select('#chart').append('svg')
      .attr('class', 'chart')
      .attr('width', globalWidth)
      .attr('height', HEADER_HEIGHT + (BAR_HEIGHT + BAR_PADDING) * simpleDataLabels.length);

  prepareData();
  calculateDataOrder();

  // Header

  for (chartNo = 1; chartNo <= 2; chartNo++) {
    chart//.selectAll('text.header')
        .append('text')
        //.attr('x', 100)
        .attr('y', 40)
        .attr('class', 'header chart' + chartNo);
        //.text(function() { return 'Test' });
  }

  // Pie chart

  for (chartNo = 1; chartNo <= 2; chartNo++) {
  /*  counts = { part1: 0, part2: 0 };
    var data = (chartNo == 2) ? currentData : currentSecondaryData;
    for (var i in data) {
      if (data[i] != DATA_NOT_AVAILABLE) {
        counts[dataLabels[simpleDataLabels[i]].part] += data[i];
      }
    }*/
    var counts = [3, 1];

    var arc = d3.svg.arc()
        .outerRadius(PIE_CHART_RADIUS)
        .innerRadius(0);

    var pie = d3.layout.pie().sort(null).startAngle(0).endAngle(-3.1415 * 2);

    var pieChart = chart.append('g')
        .attr('class', 'piechart' + chartNo)
        //.attr("transform", 
        //      "translate(" + (LABEL_WIDTH + PIE_CHART_RADIUS) + "," + (HEADER_HEIGHT / 2) + ")");

    /*var g = pieChart
        .selectAll('g.arc.chart' + chartNo)
        .data(pie(counts))
        .enter()
        .append("g")
        .attr("class", 'arc chart' + chartNo);*/
    
    pieChart.selectAll('path.pie.chart' + chartNo)
        .data(pie(counts))
        .enter()
        .append("path")
        .attr("d", arc)
        .attr('class', 'pie chart' + chartNo)
        .attr("transform",
             "rotate(" + (-90 + (counts[0] / (counts[1] + counts[0])) * 180) + ")")
        .attr("part", function(d, i) { return 'part' + (i + 1) } );

    pieChart.selectAll('text.pielabel.chart' + chartNo)
        .data(pie(counts))
        .enter()
        .append("text")
        .attr('x', function(d, i) {
          return (i == 0) ? -(PIE_CHART_RADIUS + LABEL_OFFSET) : (PIE_CHART_RADIUS + LABEL_OFFSET);
        })
        .attr('y', PIE_CHART_RADIUS / 2)
        .attr("dy", "-.6em")
        .attr("part", function(d, i) { return 'part' + (i + 1) } )
        .style("text-anchor", function(d, i) {
          return (i == 0) ? 'end' : 'start';
        })
        .attr('class', 'pielabel chart' + chartNo)
        .text(function(d, i) { 
            return 'Part ' + (i + 1) + ': ' + formatValue(d.data) + ' (' + (d.data / (counts[0] + counts[1]) * 100).toFixed(1) + '%)';
        });
  }

  // Ticks

  for (chartNo = 1; chartNo <= 2; chartNo++) {
    chart.selectAll('line.tick.chart' + chartNo)
        .data(chartScaleSimple.ticks(TICK_COUNT))
        .enter().append('line')
        .attr('class', 'tick chart' + chartNo)
        .attr('y1', HEADER_HEIGHT)
        .attr('y2', '100%')
  }

  // Label

  chart.selectAll('text.label')
      .data(simpleDataLabels)
      .enter().append('text')
      .attr('class', 'label')
      .attr('part', function(d, i) { return dataLabels[simpleDataLabels[i]].part; })
      .attr('y', function(d, i) { return HEADER_HEIGHT + currentDataOrdering.indexOf(i) * (BAR_HEIGHT + BAR_PADDING) - 5; })
      .attr('dy', BAR_HEIGHT)
      .text(toTitleCase);

  // Chart

  for (chartNo = 1; chartNo <= 2; chartNo++) {
    var data = (chartNo == 2) ? currentData : currentSecondaryData;

    chart.selectAll('rect.rect.chart' + chartNo)
        .data(data)
        .enter().append('rect')
        .attr('part', function(d, i) { return dataLabels[simpleDataLabels[i]].part; })
        .attr('class', 'rect chart' + chartNo)
        .attr('height', BAR_HEIGHT);

    chart.selectAll('text.value.chart' + chartNo)
        .data(data)
        .enter().append('text')
        .attr('value', function(d) { return d; })
        .attr('class', 'value chart' + chartNo)
        .attr('dy', BAR_HEIGHT)
        .text(function(d, i) { return formatValue(d, i, chartNo); }); 
  }
}

function changeDataSource(event) {
  dataSource = event.target.getAttribute('type');

  if ((dataType == DATA_TYPE_OFFENSES_VS_ARRESTS) && 
      (dataSource == DATA_SOURCE_2010_VS_2011)) {
    dataType = DATA_TYPE_ARRESTS;
  }

  if ((dataSource != DATA_SOURCE_2010_VS_2011) && 
      (sortOrder == SORT_ORDER_PERCENTAGE_CHANGE)) {
    sortOrder = SORT_ORDER_VALUE;
  }

  updateChart(true);
  updateNav();
}

function changeSortOrder(newSortOrder) {
  sortOrder = event.target.getAttribute('type');
  updateChart(true);
  updateNav();
}

function changeDataType(newDataType) {
  dataType = event.target.getAttribute('type');

  if ((dataType == DATA_TYPE_OFFENSES_VS_ARRESTS) && 
      (dataSource == DATA_SOURCE_2010_VS_2011)) {
    dataSource = DATA_SOURCE_2011;
  }

  if ((dataType != DATA_TYPE_OFFENSES_VS_ARRESTS) && 
      (sortOrder == SORT_ORDER_PERCENTAGE_CHANGE)) {
      sortOrder = SORT_ORDER_VALUE;
  }

  updateChart(true);
  updateNav();
}

function arcTween(b, a, z) {
  //console.log(i, ':', b);
  //console.log(z);
  //console.log(arc(b));
  //return;
  var i = d3.interpolate(z, b);

  return function(t) {
    return arc(i(t));
  };
}      

/*function arcTween(b) {
      return function(a) {
        var i = d3.interpolate(a, b);
        for (var key in b) a[key] = b[key]; // update data
        return function(t) {
              return arc(i(t));
        };
      };
} */


function updateChart(animate) {
  prepareData();
  calculateChartWidth();
  calculateDataOrder();

  var time = animate ? DURATION_TIME : 0;

  // Header

  for (chartNo = 1; chartNo <= 2; chartNo++) {
    switch (chartCount) {
      case 1:
        var x = (chartNo == 1) ? (PIE_CHART_RADIUS + LABEL_WIDTH - globalWidth / 2) : (globalWidth / 2 - PIE_CHART_RADIUS / 2);
        break;
      case 2:
        var x = (chartNo == 1) ? (globalWidth * 1 / 4 - PIE_CHART_RADIUS / 2) : (globalWidth * 3 / 4 - PIE_CHART_RADIUS / 2);
        break;
    }

    // TODO: Nastiness
    switch (dataType + dataSource) {
      case DATA_TYPE_ARRESTS + DATA_SOURCE_2010:
        var header = 'Arrests in 2010';
        break;
      case DATA_TYPE_ARRESTS + DATA_SOURCE_2011:
        var header = 'Arrests in 2011';
        break;
      case DATA_TYPE_ARRESTS + DATA_SOURCE_2010_VS_2011:
        switch (chartNo) {
          case 1:
            var header = 'Arrests in 2010';
            break;
          case 2:
            var header = 'Arrests in 2011';
            break;
        }        
        break;

      case DATA_TYPE_OFFENSES + DATA_SOURCE_2010:
        var header = 'Offenses in 2010';
        break;
      case DATA_TYPE_OFFENSES + DATA_SOURCE_2011:
        var header = 'Offenses in 2011';
        break;
      case DATA_TYPE_OFFENSES + DATA_SOURCE_2010_VS_2011:
        switch (chartNo) {
          case 1:
            var header = 'Offenses in 2010';
            break;
          case 2:
            var header = 'Offenses in 2011';
            break;
        }        
        break;

      case DATA_TYPE_OFFENSES_VS_ARRESTS + DATA_SOURCE_2010:
        switch (chartNo) {
          case 1:
            var header = 'Offenses in 2010';
            break;
          case 2:
            var header = 'Arrests in 2010';
            break;
        }
        break;

      case DATA_TYPE_OFFENSES_VS_ARRESTS + DATA_SOURCE_2011:
        switch (chartNo) {
          case 1:
            var header = 'Offenses in 2011';
            break;
          case 2:
            var header = 'Arrests in 2011';
            break;
        }
        break;
    }


    var text = chart.selectAll('text.header.chart' + chartNo)
        .transition()
        .duration(time)
        .attr('x', x);

    // Don’t change the label that’s going away
    if ((chartNo != 1) || (chartCount != 1)) {
      text.text(function() { return header });
    }
  }


  // Pie chart

  for (chartNo = 1; chartNo <= 2; chartNo++) {
    var counts = { part1: 0, part2: 0 };
    var data = (chartNo == 2) ? currentData : currentSecondaryData;
    for (var i in data) {
      if (data[i] != DATA_NOT_AVAILABLE) {
        counts[dataLabels[simpleDataLabels[i]].part] += data[i];
      }
    }
    counts = [counts.part1, counts.part2];
    //console.log(counts);

    var pie = d3.layout.pie().sort(null).startAngle(0).endAngle(-3.1415 * 2);


    /*var g = chart
        .selectAll('g.arc.chart' + chartNo)
        .data(pie(counts))
        .transition()
        .duration(time);*/
    
    var arc = d3.svg.arc()
        .outerRadius(PIE_CHART_RADIUS)
        .innerRadius(0);

/*    var pieChart = chart.append('g')
        .attr('class', 'piechart' + chartNo)
        .attr("transform", 
              "translate(" + (LABEL_WIDTH + PIE_CHART_RADIUS) + "," + (HEADER_HEIGHT / 2) + ")");*/

    switch (chartCount) {
      case 1:
        var x = (chartNo == 1) ? (PIE_CHART_RADIUS + LABEL_WIDTH - globalWidth / 2) : (globalWidth / 2 - PIE_CHART_RADIUS / 2);
        break;
      case 2:
        var x = (chartNo == 1) ? (globalWidth * 1 / 4 - PIE_CHART_RADIUS / 2) : (globalWidth * 3 / 4 - PIE_CHART_RADIUS / 2);
        break;
    }

    chart.selectAll('g.piechart' + chartNo)
        .transition()
        .duration(time)
        .attr("transform", 
              "translate(" + x + "," + (PIE_CHART_Y + (HEADER_HEIGHT - PIE_CHART_Y) / 2) + ")");

    chart.selectAll('path.pie.chart' + chartNo)
        .data(pie(counts))
        .attr('d', arc)
//        .transition()
  //      .duration(time)
        .attr("transform",
             "rotate(" + (-90 + (counts[0] / (counts[1] + counts[0])) * 180) + ")")
        //.attrTween('d', arc);

    chart.selectAll('text.pielabel.chart' + chartNo)
        .data(pie(counts))
        .text(function(d, i) { 
            return 'Part ' + (i + 1) + ': ' + formatValue(d.data) + ' (' + (d.data / (counts[0] + counts[1]) * 100).toFixed(1) + '%)';
        });

    //g.selectAll('text.pielabel.chart' + chartNo)
    //    .transition()
    //    .duration(time)
    //    .data(pie(counts));
  } 

  // Label

  switch (chartCount) {
    case 1:
      var x = 0;
      break;
    case 2:
      var x = chartWidth + VALUE_WIDTH;
      break;
  }

  chart.selectAll('text.label')
      .data(currentData)
      .transition()
      .duration(time)
      .attr('y', function(d, i) { return HEADER_HEIGHT + currentDataOrdering.indexOf(i) * (BAR_HEIGHT + BAR_PADDING) - 5; })
      .attr('x', function() {
        switch (chartCount) {
          case 1:
            // Right-aligned
            return x + LABEL_WIDTH - LABEL_OFFSET - this.getBBox().width;
            break;
          case 2:
            // Centered
            return x + (LABEL_WIDTH - this.getBBox().width) / 2;
            break;
        }
      });      

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

    chart.selectAll('rect.rect.chart' + chartNo)
        .data(data)
        .transition()
        .duration(time)
        .attr('width', chartScale)
        .attr('x', function(d) { 
          if (chartNo == 1) {
            return x + VALUE_WIDTH + chartWidth - chartScale(d); 
          } else {
            return x;
          }
        })
        .attr('y', function(d, i) { return HEADER_HEIGHT + currentDataOrdering.indexOf(i) * (BAR_HEIGHT + BAR_PADDING); });

    // Weird construct for closure-in-a-loop.
    (function(chartNo) {
      chart.selectAll('text.value.chart' + chartNo)
          .data(data)
          .transition()
          .duration(time)
          .attr('x', function(d) {
            if (chartNo == 1) {
              return x + chartWidth - chartScale(d) + VALUE_WIDTH - LABEL_OFFSET - this.getBBox().width;
            } else {
              return x + chartScale(d) + LABEL_OFFSET;
            }
          })
          .attr('y', function(d, i) { return HEADER_HEIGHT + currentDataOrdering.indexOf(i) * (BAR_HEIGHT + BAR_PADDING) - 5; })
          .tween('text', function(d, i) {
            // TODO(mwichary): Must be a better way to do this.
            // b.previous?
            var initValue = parseInt(this.getAttribute('value'));
            this.setAttribute('value', d);

            var interp = d3.interpolateNumber(initValue, d);

            return function(t) {
              this.textContent = formatValue(parseInt(interp(t)), i, chartNo);
            };
          }
        );
    })(chartNo);

    // Ticks

    chart.selectAll('line.tick.chart' + chartNo)
        .data(chartScaleSimple.ticks(TICK_COUNT))
        .transition()
        .duration(time)
        .attr('x1', function(d) {
          if (chartNo == 1) {
            return x + VALUE_WIDTH + chartWidth - chartScale(d); 
          } else {
            return x + chartScale(d);
          }
        })
        .attr('x2', function(d) {
          if (chartNo == 1) {
            return x + VALUE_WIDTH + chartWidth - chartScale(d); 
          } else {
            return x + chartScale(d);
          }
        });

  }
}

function updateNav() {
  var els = document.querySelectorAll('nav button.selected');
  for (var i = 0, el; el = els[i]; i++) {
    el.classList.remove('selected');
  }

  document.querySelector('nav button[type="' + dataSource + '"]').classList.add('selected');
  document.querySelector('nav button[type="' + dataType + '"]').classList.add('selected');
  document.querySelector('nav button[type="' + sortOrder + '"]').classList.add('selected');

  var sortOrderByPercChangeAvailable =
     ((dataSource == DATA_SOURCE_2010_VS_2011) || 
      (dataType == DATA_TYPE_OFFENSES_VS_ARRESTS));

  document.querySelector('nav button[type="sort-order-percentage-change"]').disabled = 
    !sortOrderByPercChangeAvailable;
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

  updateNav();
}

function loadData() {
  queue()
      .defer(d3.json, 'data.json')
      .await(dataLoaded);  
}

function main() {
  loadData();
}
