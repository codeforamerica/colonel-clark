var pg = require('pg'),
    config = require('config'),
    uuid = require('node-uuid'),
    async = require('async');

exports.post = function(req, res, next) {

  pg.connect(process.env.DATABASE_URL || config.db_connection_string, function(err, client) {
    
    if (err) {
      console.error(err);
      res.send(500, { message: String(err) });
    }
  
    checkUserExists(client, req, res, next);
  
  });

}

var insertUser = function(client, email_address, req, res, next) {

  var query = client.query({
    text: 'INSERT INTO users (email_address) VALUES ($1)',
    values: [ email_address ]
  });
  
  query.on('error', function(err) {
    console.error("user insert query error = " + err);
    res.send(500, { message: "query error = " + String(err) });
  });
  
  query.on('end', function(result) {
    getUser(client, email_address, req, res, next);  
  });

}

var getUser = function(client, email_address, req, res, next) {

  var query = client.query({
    text: 'SELECT _key FROM users WHERE email_address = $1',
    values: [ email_address ]
  });
  
  query.on('error', function(err) {
    console.error("query error = " + err);
    res.send(500, { message: "query error = " + String(err) });
  });
  
  var userKey = null;
  query.on('row', function(row) {
    userKey = row._key;
  });
  
  query.on('end', function(result) {
    determineNewSubscriptions(client, userKey, req, res, next);
  });

}

var determineNewSubscriptions = function(client, userKey, req, res, next) {

    var filterNewSubscriptions = function(neighborhood, callback) {
        
        query = client.query({
            text: 'SELECT neighborhood FROM user_subscriptions WHERE user__key = $1 AND neighborhood = $2',
            values: [ userKey, neighborhood ]
        });

        query.on('error', function(err) {
            console.error("query error = " + err);
            res.send(500, { message: "query error = " + String(err) });
        });
        
        var isSubscriptionNew = true;
        query.on('row', function(row) {
            isSubscriptionNew = false;
        });
        
        query.on('end', function(result) {
            callback(isSubscriptionNew);
        });

    };

    async.filter(req.body.neighborhoods, filterNewSubscriptions, function(results) {
        insertNewSubscriptions(client, userKey, results, req, res, next);
    });

}

var insertNewSubscriptions = function(client, userKey, newSubscriptions, req, res, next) {

    var insertNewSubscription = function(neighborhood, callback) {

        query = client.query({
            text: 'INSERT INTO user_subscriptions (user__key, neighborhood, uuid, subscribed_on) '
                + 'VALUES($1, $2, $3, $4)',
            values: [ userKey, neighborhood, uuid.v4(), new Date() ]
        });

        query.on('error', function(err) {
            console.error("query error = " + err);
            res.send(500, { message: "query error = " + String(err) });
        });
    
        query.on('end', function(result) {
            callback();
        });
    
    };

    async.forEach(newSubscriptions, insertNewSubscription, function(err) {
        res.send({
            message: newSubscriptions.length + " new subscriptions added."
        });
    });

}

var checkUserExists = function(client, req, res, next) {

  // Insert user if necessary
  var email_address = req.params.email;
  
  var query = client.query({
    text: 'SELECT 1 FROM users WHERE email_address = $1',
    values: [ req.params.email ]
  });
  
  query.on('error', function(err) {
    console.error("query error = " + err);
    res.send(500, { message: "query error = " + String(err) });
  });
  
  user_exists = false;
  query.on('row', function(row) {
    user_exists = true;
  });
  
  query.on('end', function(result) {
    if (!user_exists) {
      insertUser(client, email_address, req, res, next);
    } else {
      getUser(client, email_address, req, res, next);
    }
  });

}
