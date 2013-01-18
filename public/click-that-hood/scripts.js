var HIGHLIGHT_DELAY = 1500;
var NEXT_GUESS_DELAY = 1000;

var MAP_VERT_PADDING = 50;

var NEIGHBORHOODS = [
  { title: 'Algonquin' },
  { title: 'Audubon' },
  { title: 'Avondale Melbourne Heights' },
  { title: 'Bashford Manor' },
  { title: 'Beechmont' },
  { title: 'Belknap' },
  { title: 'Bon Air' },
  { title: 'Bonnycastle' },
  { title: 'Bowman' },
  { title: 'Brownsboro Zorn' },
  { title: 'Butchertown' },
  { title: 'California' },
  { title: 'Camp Taylor' },
  { title: 'Central Business District' },
  { title: 'Cherokee Gardens' },
  { title: 'Cherokee Seneca' },
  { title: 'Cherokee Triangle' },
  { title: 'Chickasaw' },
  { title: 'Clifton' },
  { title: 'Clifton Heights' },
  { title: 'Cloverleaf' },
  { title: 'Crescent Hill' },
  { title: 'Deer Park' },
  { title: 'Edgewood' },
  { title: 'Fairgrounds' },
  { title: 'Gardiner Lane' },
  { title: 'Germantown' },
  { title: 'Hallmark' },
  { title: 'Hawthorne' },
  { title: 'Hayfield Dundee' },
  { title: 'Hazelwood' },
  { title: 'Highland Park' },
  { title: 'Highlands' },
  { title: 'Highlands Douglas' },
  { title: 'Hikes Point' },
  { title: 'Irish Hill' },
  { title: 'Iroquios Park' },
  { title: 'Iroquois' },
  { title: 'Jacobs' },
  { title: 'Kenwood Hill' },
  { title: 'Klondike' },
  { title: 'Limerick' },
  { title: 'Merriwether' },
  { title: 'Old Louisville' },
  { title: 'Paristowne Point' },
  { title: 'Park Duvalle' },
  { title: 'Park Hill' },
  { title: 'Parkland' },
  { title: 'Phoenix Hill' },
  { title: 'Poplar Level' },
  { title: 'Portland' },
  { title: 'Prestonia' },
  { title: 'Rock Creek Lexington Road' },
  { title: 'Russell' },
  { title: 'Saint Joseph' },
  { title: 'Schnitzelburg' },
  { title: 'Shawnee' },
  { title: 'Shelby Park' },
  { title: 'Smoketown Jackson' },
  { title: 'South Louisville' },
  { title: 'Southside' },
  { title: 'Soutland Park' },
  { title: 'Taylor Berry' },
  { title: 'Tyler Park' },
  { title: 'University' },
  { title: 'Wilder Park' },
  { title: 'Wyandotte' },
];

var startTime = 0;
var timerIntervalId;

var neighborhoodsToBeGuessed = [];
var neighborhoodsGuessed = [];

var mapClickable = false;

var mapReady = false;

function updateData() {
  loadData();
  updateNav();
  updateCaption();
  window.setTimeout(updateMap, 0);
}

function calculateMapSize() {
  // TODO get from the map itself
  // At scale 250.000
  var mapWidth = 1507 / 2500000;
  var mapHeight = 1196 / 2500000;

  // TODO better const
  canvasWidth = document.querySelector('#map').offsetWidth;
  canvasHeight = document.querySelector('#map').offsetHeight - MAP_VERT_PADDING * 2;

  var desiredWidth = canvasWidth;
  var desiredHeight = canvasWidth / mapWidth * mapHeight;

  if (desiredHeight > canvasHeight) {
    var desiredHeight = canvasHeight;
    var desiredWidth = canvasHeight / mapHeight * mapWidth;
  }

  // TODO const
  var scale = desiredWidth / mapWidth;// * .95;
  // TODO not top-level variable
  globalScale = scale;

  // TODO get lat/long from the map itself
  mapPath = d3.geo.path().projection(
      d3.geo.mercator().center([-85.735719, 38.214]).
      scale(globalScale).translate([canvasWidth / 2, canvasHeight / 2]));
}

function prepareMap() {
  calculateMapSize();

  mapSvg = d3.select('#svg-container').append('svg')
      //.attr('width', '100%')
      //.attr('height', '100%')
      //.attr('viewBox', '0 0 ' + canvasWidth + ' ' + canvasHeight)
      //.attr("preserveAspectRatio", "xMidYMid meet");

      .attr('width', canvasWidth)
      .attr('height', canvasHeight);    

  queue()
      .defer(d3.json, 'louisville.json')
      .await(mapIsReady);
}

function mapIsReady(error, us) {
  mapReady = true;

  mapUsData = us;

  mapSvg
    .selectAll('path')
    .data(mapUsData.features)
    .enter()
    .append('path')
    .attr('d', mapPath)
    .attr('class', 'neighborhood unguessed')
    .attr('name', function(d) { return d.properties.name; })
    .on('click', function(d) {
      handleNeighborhoodClick(this, d.properties.name);
    })
    .on('mouseover', function(d) {
      // TODO make a function

      var el = d3.event.target || d3.eent.toElement;

      var boundingBox = el.getBBox();

      var hoverEl = document.querySelector('#neighborhood-hover');

      hoverEl.innerHTML = d.properties.name;  

      hoverEl.style.left = (boundingBox.x + boundingBox.width / 2 - hoverEl.offsetWidth / 2) + 'px';
      hoverEl.style.top = (boundingBox.y + boundingBox.height) + 'px';

      hoverEl.classList.add('visible');  
    })
    .on('mouseout', function(d) {
      // TODO use target
      document.querySelector('#neighborhood-hover').classList.remove('visible');  
    });
}

function setMapClickable(newMapClickable) {
  mapClickable = newMapClickable;

  if (mapClickable) {
    document.body.classList.remove('no-hover');
  } else {
    document.body.classList.add('no-hover');    
  }
}

function handleNeighborhoodClick(el, name) {
  if (!mapClickable) {
    return;
  }

  // Assuming accidental click on a neighborhood already guessed
  // TODO does this still work?
  if (neighborhoodsGuessed.indexOf('name') != -1) {
    return;
  }

  setMapClickable(false);

  if (name == neighborhoodToBeGuessedNext) {
    el.classList.remove('unguessed');
    el.classList.add('guessed');

    neighborhoodsGuessed.push(name);

    var no = neighborhoodsToBeGuessed.indexOf(name);

    neighborhoodsToBeGuessed.splice(no, 1);

    updateCount();

    if (neighborhoodsToBeGuessed.length == 0) {
      gameOver();
    } else {
      window.setTimeout(nextGuess, NEXT_GUESS_DELAY);
    }
  } else {
    el.classList.remove('unguessed');
    el.classList.add('wrong-guess');

    var correctEl = document.querySelector('#map svg [name="' + neighborhoodToBeGuessedNext + '"]');
    correctEl.classList.add('right-guess');

    window.setTimeout(removeNeighborhoodHighlights, HIGHLIGHT_DELAY);
    window.setTimeout(nextGuess, HIGHLIGHT_DELAY + NEXT_GUESS_DELAY);
  }

  neighborhoodToBeGuessedNext = '';
  updateNeighborhoodDisplay();
}

function updateCount() {
  document.querySelector('#count').innerHTML = 
      neighborhoodsGuessed.length + ' of ' + 
      (neighborhoodsGuessed.length + neighborhoodsToBeGuessed.length);
}

function removeNeighborhoodHighlights() {
  var el = document.querySelector('#map svg .wrong-guess');
  if (el) {
    el.classList.remove('wrong-guess');
    el.classList.add('unguessed');
  }

  var el = document.querySelector('#map svg .right-guess');
  if (el) {
    el.classList.remove('right-guess');
    el.classList.add('unguessed');
  }
}

function updateNeighborhoodDisplay() {
  if (neighborhoodToBeGuessedNext) {
    document.querySelector('#neighborhood-guess').classList.add('visible');  
  } else {
    document.querySelector('#neighborhood-guess').classList.remove('visible');      
  }

  document.querySelector('#neighborhood-guess span').innerHTML = 
    neighborhoodToBeGuessedNext;  
}

function nextGuess() {
  setMapClickable(true);

  var pos = Math.floor(Math.random() * neighborhoodsToBeGuessed.length);

  neighborhoodToBeGuessedNext = neighborhoodsToBeGuessed[pos];
  updateNeighborhoodDisplay();
}

function startIntro() {
  document.querySelector('#cover').classList.add('visible');
  document.querySelector('#intro').classList.add('visible');
}

function startGame() {
  document.querySelector('#intro').classList.remove('visible');  
  document.querySelector('#cover').classList.remove('visible');
  window.setTimeout(nextGuess, NEXT_GUESS_DELAY);

  updateCount();

  startTime = new Date().getTime();
  timerIntervalId = window.setInterval(updateTimer, 100);
}

function gameOver() {
  window.clearInterval(timerIntervalId);

  document.querySelector('#cover').classList.add('visible');
  document.querySelector('#congrats').classList.add('visible');  
}

function updateTimer() {
  var elapsedTime = Math.floor((new Date().getTime() - startTime) / 100);

  var tenthsOfSeconds = elapsedTime % 10;

  var seconds = Math.floor(elapsedTime / 10) % 60;
  if (seconds < 10) {
    seconds = '0' + seconds;
  }

  var minutes = Math.floor(elapsedTime / 600);

  document.querySelector('#time').innerHTML = 
    minutes + ':' + seconds + '.' + tenthsOfSeconds;
}

function getGoogleMapsUrl(lat, lon, zoom, scale, type) {
  var url = 'http://maps.googleapis.com/maps/api/staticmap' +
      '?center=' + lat + ',' + lon +
      '&zoom=' + zoom + '&size=640x640' +
      '&sensor=false&scale=' + scale + '&maptype=' + type + '&format=jpg';

  return url;
}

var MAP_OVERLAY_TILES_COUNT_X = 2;
var MAP_OVERLAY_TILES_COUNT_Y = 2;
var MAP_OVERLAY_OVERLAP_RATIO = .95;

function prepareMapOverlay() {
  var LAT_STEP = -.1725;
  var LONG_STEP = .2195;

  var lat = 38.214 - LAT_STEP / 2;
  var lon = -85.735719 - LONG_STEP / 2;

  var pixelRatio = window.devicePixelRatio || 1;

  for (var x = 0; x < MAP_OVERLAY_TILES_COUNT_X; x++) {
    for (var y = 0; y < MAP_OVERLAY_TILES_COUNT_Y; y++) {
      var url = getGoogleMapsUrl(
          lat + y * LAT_STEP * MAP_OVERLAY_OVERLAP_RATIO, 
          lon + x * LONG_STEP * MAP_OVERLAY_OVERLAP_RATIO, 
          12, 
          pixelRatio, 
          'satellite');

      var imgEl = document.createElement('img');
      imgEl.src = url;

      document.querySelector('#google-maps-overlay').appendChild(imgEl);
    }
  }
}

function resizeMapOverlay() {
  var canvasWidth = document.querySelector('#map').offsetWidth;
  var canvasHeight = document.querySelector('#map').offsetHeight - MAP_VERT_PADDING * 2;

  var size = globalScale * 0.0012238683395795992;
  size = size * 0.995 / 2;

  var offsetX = canvasWidth / 2 - size;
  var offsetY = canvasHeight / 2 - size + 50;

  var els = document.querySelectorAll('#google-maps-overlay img');

  var elCount = 0;
  for (var x = 0; x < MAP_OVERLAY_TILES_COUNT_X; x++) {
    for (var y = 0; y < MAP_OVERLAY_TILES_COUNT_Y; y++) {
      var el = els[elCount];
      elCount++;

      el.style.width = size + 'px';
      el.style.height = size + 'px';

      el.style.left = (offsetX + size * x * MAP_OVERLAY_OVERLAP_RATIO) + 'px';
      el.style.top = (offsetY + size * y * MAP_OVERLAY_OVERLAP_RATIO) + 'px';
    }
  }
}

function onResize() {
  calculateMapSize();
  resizeMapOverlay();

  mapSvg.attr('width', canvasWidth);
  mapSvg.attr('height', canvasHeight);

  //console.log(mapSvg.attr('width'));
  //console.log(mapSvg.attr('height'));

  mapSvg
    .selectAll('path')
    .attr('d', mapPath);

}

function main() {
  prepareMap();

  prepareMapOverlay();
  resizeMapOverlay();

  for (var i in NEIGHBORHOODS) {
    neighborhoodsToBeGuessed.push(NEIGHBORHOODS[i].title);
  }

  window.addEventListener('resize', onResize, false);

  startIntro();
}