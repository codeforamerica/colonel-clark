var csv = require('csv-stream'),
request = require('request');

var Extractor = function(uri) {

  // Properties
  this.uri = uri;
  this.transformer = null;
  this.options = {
    delimiter: '\t'
  }

  this.setTransformer = function(transformer) {
    this.transformer = transformer;
  }

  this.run = function() {

    console.log("Downloading data from " + this.uri + "...");
    var csvStream = csv.createStream(this.options);
    request(this.uri).pipe(csvStream)
      .on('error', function(err) {
        console.error(err);
      })
      .on('data', function(data) {
        if (this.transformer)
          this.transformer.run.call(this.transformer, data);
      }.bind(this))

  }

}

exports.createExtractor = function(uri) {
  return new Extractor(uri);
}
