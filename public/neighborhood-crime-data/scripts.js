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

//var fakeData = [];

//var unfilteredData = [];

var data = [];
var filters = [];

var mapReady = false;

/*function createFakeData() {
  fakeData = [];

  for (var i in filters[0].choices) {
    fakeData[i] = [];

    for (var j in filters[1].choices) {
      var randomVal = filters[1].choices[j].title.charCodeAt(0) + filters[1].choices[j].title.charCodeAt(1); 
      fakeData[i][j] = Math.floor(Math.random() * (i * randomVal)) * 3;
    }
  } 
}*/


function createNav() {
  for (var i in filters) {
    var filter = filters[i];

    var el = document.createElement('ul');

    el.setAttribute('filterNumber', i);

    for (var j in filter.choices) {
      var liEl = document.createElement('li');
      liEl.innerHTML = 
          '<span class="name">' + filter.choices[j].title + '</span>' +
          '<span class="value">' + '–' + '</span>' +
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
    return '–';
  } else {
    return number.toString().replace(/\d(?=(?:\d{3})+(?!\d))/g, '$&,');
  }
}

function updateNav() {
  var els = document.querySelectorAll('body > nav li');
  for (var i = 0, el; el = els[i]; i++) {
    el.classList.remove('selected');
    el.classList.remove('active');
  }

  for (var i in filters) {
    var max = 0;

    for (var j in filters[i].choices) {
      var el = document.querySelector(
          'body > nav > ul[filterNumber="' + 
          (parseInt(i)) + '"] > li[choiceNumber="' + 
          (filters[i].choices[j].choiceNumber) + '"] > .value');

      var val = data[i][j];
      el.innerHTML = formatNumber(val);

      if (val > max) {
        max = val;
      }
    }

    for (var j in filters[i].choices) {
      var el = document.querySelector(
          'body > nav > ul[filterNumber="' + 
          (parseInt(i)) + '"] > li[choiceNumber="' + 
          (filters[i].choices[j].choiceNumber) + '"] > .chart');

      var val = parseFloat(data[i][j]);
      el.style.width = ((val / max) * CHART_WIDTH) + 'px';
    }

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

  }
}

function updateData() {
  loadIncidents();

  updateCaption();

  //loadData();
  
  // predicated on the above
  //updateNav();
  //window.setTimeout(updateMap, 0);
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
    if (max < data[1][i]) {
      max = data[1][i];
    }

    map[filters[1].choices[i].title] = i;
  }

  var quantize = d3.scale.quantize()
    .domain([0, max])
    .range(d3.range(9).map(function(i) { return 'q' + i + '-9'; }));

  mapSvg.selectAll('path')
    .attr('class', function(d) { return 'state ' + quantize(data[1][map[d.properties.name]]); })

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
  // TODO hardcoded
  for (var i in neighborhoods) {
    FILTERS[1].choices[0].choices.push({ title: neighborhoods[i] });
  }
}


function loadDataOLD() {
  data = [];

  data[0] = [];
  data[1] = [];

  // TODO(mwichary): Unify this

  for (var i in filters[0].choices) {
    data[0][filters[0].choices[parseInt(i)].choiceNumber] = 0;

    var choice = filters[0].choices[i];

    for (var ii in choice.filterList) {
      for (var j in filters[1].choices[filters[1].selected].filterList) {
        var jj = filters[1].choices[filters[1].selected].filterList[j];

        data[0][filters[0].choices[parseInt(i)].choiceNumber] += 
            fakeData[choice.filterList[ii]][jj];
      }
    }
  }

  for (var j in filters[1].choices) {
    data[1][filters[1].choices[parseInt(j)].choiceNumber] = 0;

    var choice = filters[1].choices[j];

    for (var jj in choice.filterList) {
      for (var i in filters[0].choices[filters[0].selected].filterList) {
        var ii = filters[0].choices[filters[0].selected].filterList[i];

        data[1][filters[1].choices[parseInt(j)].choiceNumber] += 
            fakeData[ii][choice.filterList[jj]];
      }
    }
  }
}

function incidentsLoaded(error, loadedData) {
  console.log('Incidents loaded…', loadedData);

  data = [];

  data[0] = [];
  data[1] = [];  

  for (var i in filters[0].choices) {
    data[0][filters[0].choices[parseInt(i)].choiceNumber] = 0;

    var choice = filters[0].choices[i];

    for (var ii in choice.filterList) {
      var title = filters[0].choices[choice.filterList[ii]].title;
      title = title.toUpperCase();
      //console.log(title, loadedData.byCrime[title]);

      data[0][filters[0].choices[parseInt(i)].choiceNumber] += 
          loadedData.byCrime[title];
    }
  }

  //console.log('//');

  for (var j in filters[1].choices) {
    //console.log('A');
    data[1][filters[1].choices[parseInt(j)].choiceNumber] = 0;

    var choice = filters[1].choices[j];

    for (var jj in choice.filterList) {
      //console.log(choice.filterList[jj]);

      var title = filters[1].choices[choice.filterList[jj]].title;
      
      //console.log(title);

      data[1][filters[1].choices[parseInt(j)].choiceNumber] += 
          loadedData.byNeighborhood[title];
          //fakeData[ii][choice.filterList[jj]];

      //for (var i in filters[0].choices[filters[0].selected].filterList) {
        //var ii = filters[0].choices[filters[0].selected].filterList[i];


        //data[1][filters[1].choices[parseInt(j)].choiceNumber] += 
        //    fakeData[ii][choice.filterList[jj]];
      //}
    }
  }


  updateNav();
  window.setTimeout(updateMap, 0);
}

function loadIncidents() {
  if (filters[0].selected == 0) {
    var crime = '';
  } else {
    var crime = filters[0].choices[filters[0].selected].title;
  }

  if (filters[1].selected == 0) {
    var neighborhood = '';
  } else {
    var neighborhood = filters[1].choices[filters[1].selected].title;
  }

  console.log('Loading incidents…', crime, neighborhood);

  queue()
      .defer(d3.json, '/api/v1/incidents?neighborhood=' + neighborhood + '&crime=' + crime)
      .await(incidentsLoaded);  
}

function initialDataLoaded(error, mapDataLoaded) {
  // TODO don’t do global
  mapData = mapDataLoaded;

  addNeighborhoodsToFilters(mapDataLoaded);
  prepareFilters();

  //createFakeData();

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

function main() {
  loadInitialData();
}