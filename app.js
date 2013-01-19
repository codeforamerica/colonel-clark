var express = require('express'),
    api = require(__dirname + '/restapi/resources');

var app = express();
app.use(express.bodyParser());

// REST API URIs
app.get('/api/v1/crimes', api.v1.crimes.get);
app.get('/api/v1/neighborhoods', api.v1.neighborhoods.get);
app.get('/api/v1/incidents', api.v1.incidents.get);
app.put('/api/v1/user/:email/subscription/neighborhoods', api.v1.user_subscription_neighborhoods.put);

// Serve all other URIs as static files from the "public" directory.
app.use(express.static(__dirname + '/public'));

var port = process.env.PORT || 8000;
app.listen(port);
console.log("Listening on port " + port);

