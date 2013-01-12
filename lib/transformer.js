var geocoder = require('geocoder');

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

	// geocode
	var address = data.Address + ' ' + data.City + ', ' + data.State + ' ' + data.ZipCode;
	geocoder.geocode(address, function(err, geoData) {
	    if (geoData
		&& geoData.results
		&& (geoData.results.length > 0)
		&& geoData.results[0].address_components) {
		
		addressComponents = geoData.results[0].address_components;
		for (index in addressComponents) {

		    addressComponent = addressComponents[index];
		    types = addressComponent.types;

		    if (types.indexOf('neighborhood') > -1)
			data.Neighborhood = addressComponent.long_name;
		    
		}
		
	    }

	    this.loader.run.call(this.loader, data);

	}.bind(this));

    }

}

exports.createTransformer = function(uri) {
    return new Transformer(uri);
}
