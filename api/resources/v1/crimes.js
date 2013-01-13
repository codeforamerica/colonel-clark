var pg = require('pg'),
    config = require('config');

// FIXME: Refactor to reuse code
exports.get = function(req, res, next) {

    pg.connect(config.db_connection_string, function(err, client) {

	if (err) {
	    console.error(err);
	    res.send(500, { message: String(err) });
	}

	// Get crime totals by crime
	var queryText = "SELECT crime, COUNT(*) AS num_crimes FROM crimes WHERE 1=1";
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

	dataByCrime = {};
	query.on('row', function(row) {
	    dataByCrime[row.crime] = row.num_crimes;
	});

	query.on('end', function(result) {
	    
	    // Get crime totals by neighborhood
	    var queryText = "SELECT neighborhood, COUNT(*) AS num_crimes FROM crimes WHERE 1=1";
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
		data = {
		    by_crime: dataByCrime,
		    by_neighborhood: dataByNeighborhood
		}
		res.send(data);
	    });
	    
	});
	
    });
    
}
