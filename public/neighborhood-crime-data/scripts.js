var CHART_WIDTH = 50;

var DATA_TRANSITION_DELAY = 150;

var FILTERS = [
  {
    name: 'Crime types',
    choices: [
      { title: 'Total crime',
        choices: [
          { title: 'Property crime',
            choices: [
              { title: 'Auto theft' },
              { title: 'Theft' },
              { title: 'Vandalism' },
            ]
          },
          { title: 'Violent crime',
            choices: [
              { title: 'Aggravated assault' },
              { title: 'Burglary' },
              { title: 'Homicide' },
              { title: 'Robbery' },
              { title: 'Simple assault' },
            ]
          },
        ]
      }
    ]
  },
  {
    name: 'Neighborhoods',
    choices: [
      { title: 'All neighborhoods',
        choices: [
          // Neighborhoods will go in here
        ]
      }
    ]
  }
];

// data without any filters
var unfilteredData = [];
var cachedRawData = [];

var currentData = [];

var filters = [];

var mapReady = false;

function createNav() {
  for (var i in filters) {
    var filter = filters[i];

    var el = document.createElement('ul');

    el.setAttribute('filterNumber', i);

    for (var j in filter.choices) {
      var liEl = document.createElement('li');
      liEl.innerHTML = 
          '<span class="name">' + filter.choices[j].title + '</span>' +
          '<span class="value"></span>' +
          '<span class="chart"></span>';

      liEl.setAttribute('level', filter.choices[j].level);

      liEl.setAttribute('choiceNumber', filter.choices[j].choiceNumber);

      liEl.addEventListener('click', onFilterClick, false);
      liEl.addEventListener('mousedown', onFilterMouseDown, false);

      el.appendChild(liEl);
    }

    document.querySelector('body > nav').appendChild(el);
  }
}

function onFilterMouseDown(event) {
  event.preventDefault();
}

function onFilterClick(event) {
  var el = event.target;

  while (el.tagName != 'LI') {
    el = el.parentNode;
  }

  var ulEl = el.parentNode;

  var filterNumber = parseInt(ulEl.getAttribute('filterNumber'));
  var choiceNumber = parseInt(el.getAttribute('choiceNumber'));

  filters[filterNumber].selected = choiceNumber;

  updateData();
}

function formatNumber(number) {
  if (number == 0) {
    return '<span class="zero">0</span>';
  } else {
    return number.toString().replace(/\d(?=(?:\d{3})+(?!\d))/g, '$&,');
  }
}

function cleanUpNav() {
  var els = document.querySelectorAll('body > nav li');
  for (var i = 0, el; el = els[i]; i++) {
    el.classList.remove('selected');
    el.classList.remove('active');
  }
}

function updateNav() {
  cleanUpNav();

  for (var i in filters) {
    // Gray out things

    var el = document.querySelector(
        'body > nav > ul[filterNumber="' + 
        (parseInt(i)) + '"] > li[choiceNumber="' + 
        (filters[i].selected) + '"]');
    el.classList.add('selected');
    el.classList.add('active');

    var nextEl = el.nextSibling;
    while (nextEl && (nextEl.getAttribute('level') > el.getAttribute('level'))) {
      nextEl.classList.add('active');
      nextEl = nextEl.nextSibling;
    }

    // Show data and determine maximum value

    var max = 0;

    for (var j in filters[i].choices) {
      var el = document.querySelector(
          'body > nav > ul[filterNumber="' + 
          (parseInt(i)) + '"] > li[choiceNumber="' + 
          (filters[i].choices[j].choiceNumber) + '"] > .value');

      if (el.parentNode.classList.contains('active')) {
        var val = currentData[i][j];
      } else {
        var val = unfilteredData[i][i][j];        
      }

      el.parentNode.value = parseFloat(val);
      el.innerHTML = formatNumber(val);

      if (val > max) {
        max = val;
      }
    }

    // Display chart

    for (var j in filters[i].choices) {
      var el = document.querySelector(
          'body > nav > ul[filterNumber="' + 
          (parseInt(i)) + '"] > li[choiceNumber="' + 
          (filters[i].choices[j].choiceNumber) + '"] > .chart');

      el.style.width = ((el.parentNode.value / max) * CHART_WIDTH) + 'px';
    }

    // Re-sort neighborhoods based on values
    // TODO: Could this be D3’s responsibility somehow?

    if (i == 1) {
      var els = [];

      for (var j in filters[i].choices) {
        var el = document.querySelector(
            'body > nav > ul[filterNumber="' + 
            (parseInt(i)) + '"] > li[choiceNumber="' + 
            (filters[i].choices[j].choiceNumber) + '"]');

        els.push(el);
      }

      els.sort(function(a, b) { return b.value - a.value });

      for (var j in els) {
        var el = els[j];
        //console.log(el.innerHTML, el.value);

        document.querySelector(
            'body > nav > ul[filterNumber="' + 
            (parseInt(i)) + '"]').appendChild(el);
      }
    }


  }
}

function updateData() {
  updateCaption();
  loadIncidents();
}

function updateCaption() {
  document.querySelector('#caption-crime').innerHTML =
    filters[0].choices[filters[0].selected].title;

  document.querySelector('#caption-neighborhood').innerHTML =
    filters[1].choices[filters[1].selected].title;
}

function addChoices(origData, flatData, level) {
  for (var j in origData) {
    var newEntry = {
      title: origData[j].title,
      choiceNumber: null,
      filterList: null,
      level: level
    };

    flatData.push(newEntry);

    if (origData[j].choices) {
      addChoices(origData[j].choices, flatData, level + 1);
    }
  }
}

function prepareFilters() {
  filters = [];

  for (var i in FILTERS) {
    filters[i] = {};
    filters[i].selected = 0;
    filters[i].choices = [];
  
    addChoices(FILTERS[i].choices, filters[i].choices, 0);

    var maxLevel = 0;
    for (var j in filters[i].choices) {
      if (filters[i].choices[j].level > maxLevel) {
        maxLevel = filters[i].choices[j].level;
      }
    }

    var realChoiceNumber = 0;
    for (var j in filters[i].choices) {
      if (filters[i].choices[j].level < maxLevel) {
        filters[i].choices[j].choiceNumber = realChoiceNumber;
        filters[i].choices[j].filterList = [];
      } else {
        filters[i].choices[j].choiceNumber = realChoiceNumber;
        filters[i].choices[j].filterList = [realChoiceNumber];

        var k = parseInt(j) - 1;
        var level = filters[i].choices[j].level - 1;
        while (k >= 0) {
          if (filters[i].choices[k].level == level) {
            filters[i].choices[k].filterList.push(parseInt(j));
            level--;
          }
          k--;
        }
      }
      realChoiceNumber++;

    }
  }  
}

function prepareMap() {
  mapPath = d3.geo.path().projection(d3.geo.albers().scale(180000).center([12.28, 38.226314]));

  mapSvg = d3.select('#map').append('svg')
      .attr('width', 900)
      .attr('height', 540);    
}

// TODO stupid name
function switchToState(stateName) {
  var state = 0;

  for (var i = 1; i < filters[1].choices.length; i++) {
    if (filters[1].choices[i].title == stateName) {
      state = i;
      break;
    }
  }

  if (filters[1].selected == state) {
    filters[1].selected = 0;
  } else {
    filters[1].selected = state;
  }

  updateData();  
}

function mapIsReady(error, us) {
  mapReady = true;

  mapSvg.append('g')
    .attr('class', 'state-bound')

    .selectAll('path')
    .data(mapData.features)
    .enter()
    .append('path')
    .attr('d', mapPath)
    .attr('state', function(d) { return d.properties.name; })
    .on('click', function() {
      switchToState(this.getAttribute('state'));
    })
    .on('mouseover', function() {
      // TODO class
      d3.select(this)
        .style('stroke', 'black')
        .style('stroke-width', 3)
    })
    .on('mouseout', function() {
      d3.select(this)
      // TODO class
        .style('stroke', '')
        .style('stroke-width', '')
        .style('fill', '');
    });

  // DEBUG
  //updateMap();
}

function updateMap() {
  if (!mapReady) {
    return;
  }

  var max = 0;
  var map = {};
  for (var i = 1; i < filters[1].choices.length; i++) {
    if (max < unfilteredData[1][1][i]) {
      max = unfilteredData[1][1][i];
    }

    map[filters[1].choices[i].title] = i;
  }

  var quantize = d3.scale.quantize()
    .domain([0, max])
    .range(d3.range(9).map(function(i) { return 'q' + i; }));

  mapSvg.selectAll('path')
    .attr('class', function(d) { return 'state ' + quantize(unfilteredData[1][1][map[d.properties.name]]); })

  // TODO change to a class
  if (filters[1].selected == 0) {
    mapSvg.selectAll('path')
      .transition().duration(DATA_TRANSITION_DELAY)
      .attr('opacity', 1);
  } else {
    mapSvg.selectAll('path')
      .transition().duration(DATA_TRANSITION_DELAY)
      .attr('opacity', function(d) { 
        return (filters[1].choices[filters[1].selected].title == d.properties.name) ? 1 : .25
    });
  }
}

function addNeighborhoodsToFilters(mapData) {
  var neighborhoods = [];

  for (var i in mapData.features) {
    neighborhoods.push(mapData.features[i].properties.name);
  }

  neighborhoods.sort();

  // TODO modifying const
  // TODO hardcoded numbers
  for (var i in neighborhoods) {
    FILTERS[1].choices[0].choices.push({ title: neighborhoods[i] });
  }
}

function incidentsLoaded(error) {
  console.log('Incidents loaded…');

  for (var i = 1; i < arguments.length; i++) {
    var data = arguments[i];

    var crime = data.query.filters.crime || '';
    var neighborhood = data.query.filters.neighborhood || '';

    // TODO cachedRawData necessary?
    if (!cachedRawData[crime]) {
      cachedRawData[crime] = [];
    }
    cachedRawData[crime][neighborhood] = data;

    processData(crime, neighborhood, data);
  }

  updateNav();
  window.setTimeout(updateMap, 0);
}

function processData(crime, neighborhood, loadedData) {
  //console.log('Processing', 'c:' + crime, 'n:' + neighborhood);
  //loadedData = data;

  data = [];

  data[0] = [];
  data[1] = [];  

  for (var i in filters[0].choices) {
    data[0][filters[0].choices[parseInt(i)].choiceNumber] = 0;

    var choice = filters[0].choices[i];

    for (var ii in choice.filterList) {
      var title = filters[0].choices[choice.filterList[ii]].title;
      title = title.toUpperCase();

      data[0][filters[0].choices[parseInt(i)].choiceNumber] += 
          loadedData.byCrime[title] || 0;
    }
  }

  for (var j in filters[1].choices) {
    data[1][filters[1].choices[parseInt(j)].choiceNumber] = 0;

    var choice = filters[1].choices[j];

    for (var jj in choice.filterList) {
      var title = filters[1].choices[choice.filterList[jj]].title;
      
      data[1][filters[1].choices[parseInt(j)].choiceNumber] += 
          loadedData.byNeighborhood[title] || 0;
    }
  }

  /*if ((filters[0].selected == 0) && (filters[1].selected == 0)) {
    unfilteredData = currentData;
  }*/



  // TODO actually compare crime and neighborhood strings to numbers
  // and allocate properly
  if (crime == '') {
    //console.log('allocated unfiltered data 0 (crime)');
    unfilteredData[0] = data;
  }

  if (neighborhood == '') {
    //console.log('allocated unfiltered data 1 (n)');
    unfilteredData[1] = data;
  }

  if ( ((crime != '') || (filters[0].selected == 0)) &&
       ((neighborhood != '') || (filters[1].selected == 0)) ) {
    //console.log('allocated proper data');
    currentData = data;
  }
}

function getIncidentDataUrl(crimeId, neighborhoodId) {
  if (crimeId == 0) {
    var crime = '';
  } else {
    console.log(crimeId);

    //console.log(filters[0].choices[crimeId].filterList);

    var crimeList = [];
    for (var i in filters[0].choices[crimeId].filterList) {
      crimeList.push(filters[0].choices[filters[0].choices[crimeId].filterList[i]].title);
    }
    var crime = crimeList.join(',').toUpperCase();

    //filters[1].choices[filters[1].selected]

    //var crime = filters[0].choices[crimeId].title.toUpperCase();
    console.log(crime);
  }

  if (neighborhoodId == 0) {
    var neighborhood = '';
  } else {
    var neighborhood = filters[1].choices[neighborhoodId].title;
  }

  // TODO remove random when you do caching properly
  var url = '/api/v1/incidents?neighborhood=' + encodeURI(neighborhood) + 
      '&crime=' + encodeURI(crime) + '&rand=' + Math.random();

  return url;
}

function loadIncidents() {
  var urls = [];
  urls.push(getIncidentDataUrl(filters[0].selected, filters[1].selected));
  urls.push(getIncidentDataUrl(0, filters[1].selected));
  urls.push(getIncidentDataUrl(filters[0].selected, 0));

  var q = queue();
  for (var i in urls) {
    q.defer(d3.json, urls[i]);
    console.log('Loading incidents…', urls[i]);
  }
  q.await(incidentsLoaded);
}

function initialDataLoaded(error, mapDataLoaded) {
  // TODO don’t do global
  mapData = mapDataLoaded;

  addNeighborhoodsToFilters(mapDataLoaded);
  prepareFilters();

  createNav();

  updateData();

  // TODO consolidate
  prepareMap();
  mapIsReady();
}

function loadInitialData() {
  queue()
      .defer(d3.json, '/api/v1/neighborhoods')
      .await(initialDataLoaded);
}

function prepareUI() {
  for (var i = 0; i < 9; i++) {
    var el = document.createElement('div');
    el.classList.add('q' + i);
    document.querySelector('#legend-graph').appendChild(el);
  }
}

function main() {
  prepareUI();

  loadInitialData();
}