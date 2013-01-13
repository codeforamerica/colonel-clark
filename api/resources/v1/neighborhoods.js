var geojson = require('geojson'),
    pg = require('pg'),
    config = require('config');

exports.get = function(req, res, next) {

    pg.connect(config.db_connection_string, function(err, client) {

	if (err) {
	    console.error(err);
	    res.send(500, { message: String(err) });
	}

	var query = client.query({
	    text: "SELECT name, ST_AsGeoJSON(geom) AS geojson FROM neighborhoods WHERE city = $1",
	    values: [ "Louisville" ]
	});

	query.on('error', function(err) {
	    console.error("query error = " + err);
	    res.send(500, { message: "query error = " + String(err) });
	});

	data = [];
	query.on('row', function(row) {
	    data.push({
		name: row.name,
		coordinates: JSON.parse(row.geojson).coordinates
	    });
	});

	query.on('end', function(result) {
	    geojson.parse(data, { MultiPolygon: 'coordinates' }, function(json) {
		res.send(json);
	    });

	});

    });

}
