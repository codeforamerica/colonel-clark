var config = require('config'),
    request = require('request');

exports.createTransformer = function() {

    // Properties
    var loader = null;

    return {

        // Methods
        setLoader: function(l) {
            loader = l;
        },

        run: function(data) {

            // reported date/time = reported date + reported time
            data.ReportedDateTime = data.DateReported + ' ' + data.TimeReported;
            
            // determine neighborhood if possible
            var queryText = "SELECT n.name "
                + "FROM neighborhoods AS n "
                + "WHERE ST_Covers(n.the_geom, ST_SetSRID(ST_GeomFromText('POINT("
                + data.Longitude
                + " "
                + data.Latitude
                + ")'), 4326))"

            var cartoDbApiUri = config.cartodb_api_base_uri
                + '?q=' + queryText

            request(cartoDbApiUri, function(err, response, body) {

                if (err) {
                    console.error('CartoDB API returned error:');
                    console.error(err);
                }
                
                body = JSON.parse(body);
                if (body.total_rows === 1) {
                    var neighborhood = body.rows[0].name;                  
                    data.Neighborhood = neighborhood;
                    console.log('Mapped incident to neighborhood ' + neighborhood);
                } else {
                    console.warn('Could not map incident to neighborhood');
                }

                loader.run.call(loader, data);

            });

        }

    }
}
