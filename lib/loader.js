var pg = require('pg');

var Loader = function(dbConnectionString) {

  // Properties
  this.dbConnectionString = dbConnectionString;

  // Methods
  this.updateRecord = function(data) {

    var queryText = "UPDATE crimes SET "
    + "incident_timestamp = $1, "
    + "reported_timestamp = $2, "
    + "street_address = $4, "
    + "city = $5, "
    + "zipcode = $6, "
    + "beat = $7, "
    + "category = $9, "
    + "division = $10, "
    + "sector = $11, "
    + "incident_beat = $12, "
    + "neighborhood = $13, "
    + "lat = $14, "
    + "lon = $15 "
    + "WHERE case_number = $3 AND crime = $8";

    var query = this.client.query({
      text: queryText,
      values: [
      data.IncidentDate,
      data.ReportedDateTime,
      data.CaseNumber,
      data.Address,
      data.City,
      data.ZipCode,
      data.Beat,
      data.Crime,
      data.Category,
      data.Division,
      data.Sector,
      data.IncidentBeat,
      data.Neighborhood,
      data.Latitude,
      data.Longitude
      ]
    });

    query.on('error', function(error) {
      console.error('query error = ' + error + '. Data below:');
      console.error(data);
    });		     

    query.on('end', function(result) {
      console.info("Updated crime with case number = " + data.CaseNumber + " and crime = " + data.Crime);
    });

  };

  this.insertRecord = function(data)  {

    var queryText = "INSERT INTO crimes ("
      + "incident_timestamp, "
      + "reported_timestamp, "
      + "case_number, "
      + "street_address, "
      + "city, "
      + "zipcode, "
      + "beat, "
      + "crime, "
      + "category, "
      + "division, "
      + "sector, "
      + "incident_beat,"
      + "lat,"
      + "lon,"
      + "neighborhood"
      + ") VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)";

    var query = this.client.query({
      text: queryText,
      values: [
        data.IncidentDate,
        data.ReportedDateTime,
        data.CaseNumber,
        data.Address,
        data.City,
        data.ZipCode,
        data.Beat,
        data.Crime,
        data.Category,
        data.Division,
        data.Sector,
        data.IncidentBeat,
        data.Latitude,
        data.Longitude,
        data.Neighborhood
      ]
    });

    query.on('error', function(error) {
      console.error('query error = ' + error + '. Data below:');
      console.error(data);
    });		     

    query.on('end', function(result) {
      console.log("Inserted crime with case number = " + data.CaseNumber + " and crime = " + data.Crime);
    });

  };

  this.upsertRecord = function(data) {

    var queryText = "SELECT 1 AS exists FROM crimes WHERE case_number = $1 AND crime = $2";

    var query = this.client.query({
      text: queryText,
      values: [ data.CaseNumber, data.Crime ]
    });

    query.on('end', function(result) {
      if (result.rowCount === 1) {
        this.updateRecord(data);
      } else {
        this.insertRecord(data);
      }
    }.bind(this));

    query.on('error', function(error) {
      console.error('query error = ' + error + '. Data below:');
      console.error(data);
    });

  };

  this.run = function(data) {

    pg.connect(this.dbConnectionString, function(err, client) {

      if (err) {
        console.error(err);
        process.exit(1);
      }

      this.client = client;
      this.upsertRecord(data);

    }.bind(this));

  }

};

exports.createLoader = function(dbConnectionString) {
  return new Loader(dbConnectionString);
};
