var pg = require('pg'),
    config = require('config'),
    geojson = require('geojson');

exports.get = function(req, res, next) {

  pg.connect(process.env.DATABASE_URL || config.db_connection_string, function(err, client) {

    if (err) {
      console.error(err);
      res.send(500, { message: String(err) });
    }

    createResponse(client, req, res, next);

  });

}

var convertArrayToInList = function(arr) {
    for (index in arr) {
        arr[index] = "'" + arr[index] + "'";
    }
    return arr.join(",");
}

var createResponse = function(client, req, res, next) {

    data = {}
    data.query = {}
    data.query.filters = {}

    data.query.filters.crime = req.query.crime;

    appendCrimeTotals(client, data, req, res, next);
}

var appendCrimeTotals = function(client, data, req, res, next) {

  // Get crime totals by crime
  var queryText = "SELECT lat, lon FROM crimes WHERE neighborhood IS NOT NULL";
  if (req.query.crime) {
    var crimes = convertArrayToInList(req.query.crime.split(','));
    queryText += " AND crime IN ( " + crimes + " )";
  }

  var query = client.query(queryText);

  query.on('error', function(err) {
    console.error("query error = " + err);
    res.send(500, { message: "query error = " + String(err) });
  });

  var incidents = [];
  query.on('row', function(row) {
    incidents.push(row);
  });

  query.on('end', function(result) {
    geojson.parse(incidents, {Point: [ 'lat', 'lon' ]}, function(json) {
      data.incidents = json;
      res.send(data);
    });
  });

}
