var pg = require('pg'),
config = require('config');

exports.get = function(req, res, next) {

  pg.connect(config.db_connection_string, function(err, client) {

    if (err) {
      console.error(err);
      res.send(500, { message: String(err) });
    }

    appendCrimes(client, req, res, next);

  });

}

var appendCrimes = function(client, req, res, next) {

  // Get crimes
  var queryText = "SELECT DISTINCT(crime) FROM crimes";
  var query = client.query({
    text: queryText
  });

  query.on('error', function(err) {
    console.error("query error = " + err);
    res.send(500, { message: "query error = " + String(err) });
  });

  data = { crimes: [] };
  query.on('row', function(row) {
    data.crimes.push(row.crime);
  });

  query.on('end', function(result) {      
    res.send(data);
  });
  
}
