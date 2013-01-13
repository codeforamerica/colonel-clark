var express = require('express'),
    api = require(__dirname + '/restapi/resources');

var app = express();

// REST API URIs
app.get('/api/v1/crimes', api.v1.crimes.get);
app.get('/api/v1/neighborhoods', api.v1.neighborhoods.get);
app.get('/api/v1/incidents', api.v1.incidents.get);

// Serve all other URIs as static files from the "public" directory.
app.use(express.static(__dirname + '/public'));

app.listen(8000);

