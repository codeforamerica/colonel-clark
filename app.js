var express = require('express'),
    request = require('request'),
    api = require(__dirname + '/restapi/resources');

var app = express();
app.use(express.compress());
app.use(express.bodyParser());

// REST API URIs
app.get('/api/v1/crimes', api.v1.crimes.get);
app.get('/api/v1/neighborhoods', api.v1.neighborhoods.get);
app.get('/api/v1/incidents', api.v1.incidents.get);
app.get('/api/v1/incidents-summary', api.v1.incidents_summary.get);
app.post('/api/v1/user/:email/subscriptions', api.v1.user_subscriptions.post);
app.put('/api/v1/subscription/:id/status', api.v1.subscription_status.put);
app.del('/api/v1/subscription/:id', api.v1.subscription.del);
app.del('/api/v1/user/:id/subscriptions', api.v1.user_subscriptions.del);

// Special URIs (aka rewrite rules)
app.get('/neighborhood-crime-data/subscription/:id/confirmation', function(req, res) {
    var redirectUrl = 'http://' + req.headers.host + '/neighborhood-crime-data/email-pages/subscribe.html?u=' + req.params.id;
    req.pipe(request(redirectUrl)).pipe(res);
});

app.get('/neighborhood-crime-data/subscription/:id/removal', function(req, res) {
    var redirectUrl = 'http://' + req.headers.host + '/neighborhood-crime-data/email-pages/unsubscribe.html?s=' + req.params.id;
    req.pipe(request(redirectUrl)).pipe(res);
});

app.get('/neighborhood-crime-data/user/:id/subscriptions/removal', function(req, res) {
    var redirectUrl = 'http://' + req.headers.host + '/neighborhood-crime-data/email-pages/unsubscribe.html?u=' + req.params.id;
    req.pipe(request(redirectUrl)).pipe(res);
});

// Serve all other URIs as static files from the "public" directory.
app.use(express.static(__dirname + '/public'));

var port = process.env.PORT || 8000;
app.listen(port);
console.log("Listening on port " + port);

