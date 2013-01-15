var geocoder = require('geocoder'),
    pg = require('pg'),
    config = require('config');

var Transformer = function() {

  // Properties
  this.loader = null;
  this.options = {
    delimiter: '\t'
  }

  this.setLoader = function(loader) {
    this.loader = loader;
  }

  this.run = function(data) {

    // reported date/time = reported date + reported time
    data.ReportedDateTime = data.DateReported + ' ' + data.TimeReported;

    // determine neighborhood if possible
    pg.connect(config.db_connection_string, function(err, client) {

      if (err) {
        console.error(err);
        return;
      }

      var queryText = "SELECT n.name "
      + "FROM neighborhoods AS n "
      + "WHERE ST_Covers(n.geom, ST_GeomFromText('POINT(' || $1 || ' ' || $2 || ')'))";

      var query = client.query({
        text: queryText,
        values: [ data.Longitude, data.Latitude ]
      });

      query.on('error', function(err) {
        console.error("query error = " + err);
        return;
      });

      query.on('row', function(row) {
        data.Neighborhood = row.name;
      });

      query.on('end', function(result) {
        this.loader.run.call(this.loader, data);
      }.bind(this));

    }.bind(this));

  }

}

exports.createTransformer = function(uri) {
  return new Transformer(uri);
}
