var restify = require('restify'),
    resources = require(__dirname + '/resources');

server = restify.createServer();
server.use(restify.queryParser()); // Parse query strings

// Server and routes
server.get('/v1/crimes', resources.v1.crimes.get);
server.get('/v1/neighborhoods', resources.v1.neighborhoods.get);
server.get('/v1/incidents', resources.v1.incidents.get);

server.listen(8080, function() {
    console.log('%s listening at %s', server.name, server.url);
});
