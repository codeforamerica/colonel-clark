var request = require('request'),
    config = require('config');

exports.get = function(req, res, next) {
    
    appendNeighborhoods(req, res, next);

}

var appendNeighborhoods = function(req, res, next) {

    var queryText = "SELECT name,the_geom FROM neighborhoods WHERE city = 'Louisville'";
    
    var cartoDbApiUri = config.cartodb_api_base_uri
        + '?q=' + queryText
        + '&format=GeoJSON';
    
    request(cartoDbApiUri, function(err, response, body) {
        
        if (err) {
            console.error('CartoDB API returned error:');
            console.error(err);
            res.send(500, { message: String(err) });
        }
        
        res.send(response.statusCode, body);
        
    });

}
