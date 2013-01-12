var nodeio = require('node.io'),
    pg = require('pg'),
    crime_data_scraper = require(__dirname + '/../lib/crime_data_scraper');


var crimeDataUpdater = {};

// TODO: Move to common file
crimeDataUpdater.connectionString = "tcp://bp:bp@localhost/louisville_crime";

crimeDataUpdater.postProcessScrapedData = function(cr) {
    cr.ReportedDateTime = cr.DateReported + ' ' + cr.TimeReported;
};

crimeDataUpdater.updateRecord = function(cr) {

    var queryStr = "UPDATE crimes SET "
	+ "incident_timestamp = $1, "
	+ "reported_timestamp = $2, "
	+ "street_address = $4, "
	+ "city = $5, "
	+ "zipcode = $6, "
	+ "beat = $7, "
	+ "category = $9, "
	+ "division = $10, "
	+ "sector = $11, "
	+ "incident_beat = $12 "
	+ "WHERE case_number = $3 AND crime = $8";
    
    var query = this.client.query({
	text: queryStr,
	values: [
	    cr.IncidentDate,
	    cr.ReportedDateTime,
	    cr.CaseNumber,
	    cr.Address,
	    cr.City,
	    cr.ZipCode,
	    cr.Beat,
	    cr.Crime,
	    cr.Category,
	    cr.Division,
	    cr.Sector,
	    cr.IncidentBeat
	]
    });
    
    query.on('error', function(error) {
	console.error('query error = ' + error);
	process.exit(2);
    });		     
    
    query.on('end', function(result) {
	console.log("Updated crime with case number = " + cr.CaseNumber + " and crime = " + cr.Crime);
    });
	
};

crimeDataUpdater.insertRecord = function(cr) {

    var queryStr = "INSERT INTO crimes ("
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
	+ "incident_beat"
	+ ") VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)";
    
    var query = this.client.query({
	text: queryStr,
	values: [
	    cr.IncidentDate,
	    cr.ReportedDateTime,
	    cr.CaseNumber,
	    cr.Address,
	    cr.City,
	    cr.ZipCode,
	    cr.Beat,
	    cr.Crime,
	    cr.Category,
	    cr.Division,
	    cr.Sector,
	    cr.IncidentBeat
	]
    });
    
    query.on('error', function(error) {
	console.error('query error = ' + error);
	process.exit(3);
    });		     

    query.on('end', function(result) {
	console.log("Inserted crime with case number = " + cr.CaseNumber + " and crime = " + cr.Crime);
    });
	
    
};

crimeDataUpdater.upsertRecord = function(cr) {

    var queryStr = "SELECT 1 AS exists FROM crimes WHERE case_number = $1 AND crime = $2";

    var query = this.client.query({
	text: queryStr,
	values: [ cr.CaseNumber, cr.Crime ]
    });

    query.on('end', function(result) {
	if (result.rowCount === 1) {
	    crimeDataUpdater.updateRecord(cr);
	} else {
	    crimeDataUpdater.insertRecord(cr);
	}
    });

    query.on('error', function(error) {
	console.error('query error = ' + error);
	process.exit(4);
    });

};

crimeDataUpdater.job = crime_data_scraper.job;
crimeDataUpdater.outputCallback = function(err, crimes) {

    pg.connect(crimeDataUpdater.connectionString, function(err, client) {

	if (err) {
	    console.error(err);
	    process.exit(1);
	}

	crimeDataUpdater.client = client;

	for (index in crimes) {
	    var cr = crimes[index];

	    crimeDataUpdater.postProcessScrapedData(cr);
	    crimeDataUpdater.upsertRecord(cr);

	}

    });

};

nodeio.start(crimeDataUpdater.job, crimeDataUpdater.jobOptions, crimeDataUpdater.outputCallback, true);
