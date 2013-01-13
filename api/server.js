var restify = require('restify'),
    resources = require(__dirname + '/resources');

server = restify.createServer();

// Server and routes
server.get('/v1/crimes', resources.v1.crimes.get);
server.get('/v1/neighborhoods', resources.v1.neighborhoods.get);

server.listen(8080, function() {
    console.log('%s listening at %s', server.name, server.url);
});
