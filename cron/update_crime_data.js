var nodeio = require('node.io'),
    pg = require('pg'),
    crime_data_scraper = require(__dirname + '/../lib/crime_data_scraper');

// TODO: Move to common file
var connectionString = "tcp://bp:bp@localhost/louisville_crime";

var job = crime_data_scraper.job;
job.output_callback = function(err, crimes) {

    pg.connect(connectionString, function(err, client) {

	if (err) {
	    console.error(err);
	    process.exit(1);
	}

	client.on('drain', client.end.bind(client));


	for (index in crimes) {
	    var cr = crimes[index];

	    // Post-process scraped data
	    cr.ReportedDateTime = cr.DateReported + ' ' + cr.TimeReported;

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

	    var query = client.query({
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
		console.log('query error = ' + error);
		process.exit(2);
	    });		     

	    query.on('end', function(result) {
		console.log('query result = ' + result);
	    });
	    
	}

    });

}

// Start scraping job
nodeio.start(job, null, job.output_callback, true);
