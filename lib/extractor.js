var csv = require('csv-stream'),
    request = require('request');

exports.createExtractor = function(uri) {
    
    // Properties
    var transformer = null;
    var options = {
        delimiter: '\t'
    }

    return {

        // Methods
        setTransformer: function(t) {
            transformer = t;
        },

        run: function() {

            console.log("Downloading data from " + uri + "...");
            var csvStream = csv.createStream(options);
            request(uri).pipe(csvStream)
                .on('error', function(err) {
                    console.error(err);
                })
                .on('data', function(data) {
                    if (transformer)
                        transformer.run.call(transformer, data);
                });

        }
            
    }

}
