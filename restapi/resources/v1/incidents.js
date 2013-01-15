var pg = require('pg'),
config = require('config');

exports.get = function(req, res, next) {

  pg.connect(config.db_connection_string, function(err, client) {

    if (err) {
      console.error(err);
      res.send(500, { message: String(err) });
    }

    appendCrimeTotals(client, req, res, next);

  });

}

var appendCrimeTotals = function(client, req, res, next) {

  // Get crime totals by crime
  var queryText = "SELECT crime, COUNT(*) AS num_crimes FROM crimes WHERE neighborhood IS NOT NULL";
  var values = [];
  if (req.query.crime && req.query.neighborhood) {
    queryText += " AND crime = $1 AND neighborhood = $2";
    values = [ req.query.crime, req.query.neighborhood ];
  } else if (req.query.crime) {
    queryText += " AND crime = $1";
    values = [ req.query.crime ];
  } else if (req.query.neighborhood) {
    queryText += " AND neighborhood = $1";
    values = [ req.query.neighborhood ];
  }
  queryText += " GROUP BY crime";

  var query = client.query({
    text: queryText,
    values: values
  });

  query.on('error', function(err) {
    console.error("query error = " + err);
    res.send(500, { message: "query error = " + String(err) });
  });

  data = {}
  data.by_crime = {};
  query.on('row', function(row) {
    data.by_crime[row.crime] = row.num_crimes;
  });

  query.on('end', function(result) {
    appendCrimeTotalsByNeighborhood(client, data, req, res, next);
  });

}

var appendCrimeTotalsByNeighborhood = function(client, data, req, res, next) {

  // Get crime totals by neighborhood
  var queryText = "SELECT neighborhood, COUNT(*) AS num_crimes FROM crimes WHERE neighborhood IS NOT NULL";
  var values = [];
  if (req.query.crime && req.query.neighborhood) {
    queryText += " AND crime = $1 AND neighborhood = $2";
    values = [ req.query.crime, req.query.neighborhood ];
  } else if (req.query.crime) {
    queryText += " AND crime = $1";
    values = [ req.query.crime ];
  } else if (req.query.neighborhood) {
    queryText += " AND neighborhood = $1";
    values = [ req.query.neighborhood ];
  }
  queryText += " GROUP BY neighborhood";

  var query = client.query({
    text: queryText,
    values: values
  });

  query.on('error', function(err) {
    console.error("query error = " + err);
    res.send(500, { message: "query error = " + String(err) });
  });

  dataByNeighborhood = {};
  query.on('row', function(row) {
    dataByNeighborhood[row.neighborhood] = row.num_crimes;
  });

  query.on('end', function(result) {

    // Get crime totals by neighborhood
    data.by_neighborhood = dataByNeighborhood;
    res.send(data);
  
  });

}

