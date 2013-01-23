var pg = require('pg'),
config = require('config');

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
    data.query.filters.neighborhood = req.query.neighborhood;

    appendCrimeTotals(client, data, req, res, next);
}

var appendCrimeTotals = function(client, data, req, res, next) {

  // Get crime totals by crime
  var queryText = "SELECT crime, COUNT(*) AS num_crimes FROM crimes WHERE neighborhood IS NOT NULL";
  if (req.query.crime && req.query.neighborhood) {
    var crimes = convertArrayToInList(req.query.crime.split(','));
    var neighborhoods = convertArrayToInList(req.query.neighborhood.split(','));
    queryText += " AND crime IN ( " + crimes + " ) AND neighborhood IN ( " + neighborhoods + " )";
  } else if (req.query.crime) {
    var crimes = convertArrayToInList(req.query.crime.split(','));
    queryText += " AND crime IN ( " + crimes + " )";
  } else if (req.query.neighborhood) {
    var neighborhoods = convertArrayToInList(req.query.neighborhood.split(','));
    queryText += " AND neighborhood IN ( " + neighborhoods + " )";
  }
  queryText += " GROUP BY crime";

  var query = client.query(queryText);

  query.on('error', function(err) {
    console.error("query error = " + err);
    res.send(500, { message: "query error = " + String(err) });
  });

  data.byCrime = {};
  query.on('row', function(row) {
    data.byCrime[row.crime] = row.num_crimes;
  });

  query.on('end', function(result) {
    appendCrimeTotalsByNeighborhood(client, data, req, res, next);
  });

}

var appendCrimeTotalsByNeighborhood = function(client, data, req, res, next) {

  // Get crime totals by neighborhood
  var queryText = "SELECT neighborhood, COUNT(*) AS num_crimes FROM crimes WHERE neighborhood IS NOT NULL";
  if (req.query.crime && req.query.neighborhood) {
    var crimes = convertArrayToInList(req.query.crime.split(','));
    var neighborhoods = convertArrayToInList(req.query.neighborhood.split(','));
    queryText += " AND crime IN ( " + crimes + " ) AND neighborhood IN ( " + neighborhoods + " )";
  } else if (req.query.crime) {
    var crimes = convertArrayToInList(req.query.crime.split(','));
    queryText += " AND crime IN ( " + crimes + " )";
  } else if (req.query.neighborhood) {
    var neighborhoods = convertArrayToInList(req.query.neighborhood.split(','));
    queryText += " AND neighborhood IN ( " + neighborhoods + " )";
  }
  queryText += " GROUP BY neighborhood";

  var query = client.query(queryText);

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
    data.byNeighborhood = dataByNeighborhood;
    res.send(data);
  
  });

}

