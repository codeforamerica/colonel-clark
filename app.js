var express = require('express'),
    request = require('request'),
    api = require(__dirname + '/restapi/resources');

var app = express();
app.use(express.compress());
app.use(express.bodyParser());

// REST API URIs
/* Commenting out because we no longer want this app to be
   exposed to public (Bourbon Planners decision made on 2/5/2013)
app.get('/api/v1/crimes', api.v1.crimes.get);
app.get('/api/v1/neighborhoods', api.v1.neighborhoods.get);
app.get('/api/v1/incidents', api.v1.incidents.get);
app.get('/api/v1/incidents-summary', api.v1.incidents_summary.get);
app.post('/api/v1/user/:email/subscriptions', api.v1.user_subscriptions.post);
app.put('/api/v1/subscription/:id/status', api.v1.subscription_status.put);
app.del('/api/v1/subscription/:id', api.v1.subscription.del);
app.del('/api/v1/user/:id/subscriptions', api.v1.user_subscriptions.del);
*/

// Click that 'Hood redirect
app.get('/click-that-hood', function(req, res, next) {
    var redirectUrl = 'http://click-that-hood.herokuapp.com';
    if (req._parsedUrl.search) {
        res.redirect(redirectUrl + req._parsedUrl.search);
    } else {
        res.redirect(redirectUrl);
    }
})

// Serve all other URIs as static files from the "public" directory.
/* Commenting out because we no longer want this app to be
   exposed to public (Bourbon Planners decision made on 2/5/2013)
app.use(express.static(__dirname + '/public'));
*/

var port = process.env.PORT || 8000;
app.listen(port);
console.log("Listening on port " + port);

