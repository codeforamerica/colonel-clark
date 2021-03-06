var pg = require('pg'),
    config = require('config'),
    uuid = require('node-uuid'),
    async = require('async'),
    SendGrid = require('sendgrid').SendGrid;

exports.post = function(req, res, next) {

  pg.connect(process.env.DATABASE_URL || config.db_connection_string, function(err, client) {
    
    if (err) {
      console.error(err);
      res.send(500, { message: String(err) });
    }
  
    checkUserByEmailExists(client, req, res, next);
  
  });

}

exports.del = function(req, res, next) {

  pg.connect(process.env.DATABASE_URL || config.db_connection_string, function(err, client) {
    
    if (err) {
      console.error(err);
      res.send(500, { message: String(err) });
    }
  
    checkUserByUuidExists(client, req, res, next);
  
  });

}

var insertUser = function(client, email_address, req, res, next) {

  var query = client.query({
    text: 'INSERT INTO users (email_address, uuid) VALUES ($1, $2)',
    values: [ email_address, uuid.v4() ]
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
    text: 'SELECT * FROM users WHERE email_address = $1',
    values: [ email_address ]
  });
  
  query.on('error', function(err) {
    console.error("query error = " + err);
    res.send(500, { message: "query error = " + String(err) });
  });
  
  var user = null;
  query.on('row', function(row) {
    user = row;
  });
  
  query.on('end', function(result) {
    determineNewSubscriptions(client, user, req, res, next);
  });

}

var determineNewSubscriptions = function(client, user, req, res, next) {

    var filterNewSubscriptions = function(neighborhood, callback) {
        
        query = client.query({
            text: 'SELECT neighborhood FROM user_subscriptions WHERE user__key = $1 AND neighborhood = $2',
            values: [ user._key, neighborhood ]
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
        insertNewSubscriptions(client, user, results, req, res, next);
    });

}

var insertNewSubscriptions = function(client, user, newSubscriptions, req, res, next) {

    var subscriptionIds = {}
    var insertNewSubscription = function(neighborhood, callback) {

        var subscriptionId = uuid.v4();
        subscriptionIds[neighborhood] = subscriptionId;

        query = client.query({
            text: 'INSERT INTO user_subscriptions (user__key, neighborhood, uuid, subscribed_on) '
                + 'VALUES($1, $2, $3, $4)',
            values: [ user._key, neighborhood, subscriptionId, new Date() ]
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

        var sendSubscriptionVerification = function(neighborhood, callback) {
            
            var subscriptionLink = config.app_base_uri + 'email-pages/subscribe.html?s=' + subscriptionIds[neighborhood];
            var emailHtml = '<img src="' + config.app_base_uri + 'images/logo-retina.png" width="740" height="31" />'
                + '<p>Verify your subscription to Louisville Neighborhood Crime Data weekly emails for ' + neighborhood + ' by visiting:</p>'
                + '<p><a href="' + subscriptionLink + '">' + subscriptionLink + '</a></p>'
                + '<br><br><p>If you never intended to subscribe to our weekly crime email, please ignore this message.'
                + '<p><b>NOTE:</b> This is an experimental project and it might be suspended at any point.</p>'
                + '<p style="color: gray"><br>-- <br>'
                + 'Louisville Neighborhood Crime Data<br>'
                + '<a style="color: gray" href="mailto:louisville@codeforamerica.org">Contact us</a></p>'

            var sendgrid = new SendGrid(process.env.SENDGRID_USERNAME || config.sendgrid.user, process.env.SENDGRID_PASSWORD);
            sendgrid.send({
                to: user.email_address,
                from: 'NO-REPLY@codeforamerica.org',
                fromname: 'Louisville Neighborhood Crime Data',
                subject: 'Verify your subscription for ' + neighborhood,
                html: emailHtml
            }, function(success, message) {
                if (!success) {
                    console.log(message);
                }
            });

            callback();

        };

        async.forEach(newSubscriptions, sendSubscriptionVerification, function(err) {
            res.send({
                message: newSubscriptions.length + " new subscriptions added."
            });
        });

    });

}

var checkUserByEmailExists = function(client, req, res, next) {

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

var checkUserByUuidExists = function(client, req, res, next) {

    var userId = req.params.id;

    var query = client.query({
        text: 'SELECT * FROM users WHERE uuid = $1',
        values: [ userId ]
    });

    query.on('error', function(err) {
        console.error("user select query error = " + err);
        res.send(500, { message: "query error = " + String(err) });
    });

    var user;
    query.on('row', function(row) {
        user = row;
    });
    
    query.on('end', function(result) {
        if (user) {
            deleteAllUserSubscriptions(client, user, req, res, next);
        } else {
            res.send(404, { message: "Could not find user." });
        }
    });

}

var deleteAllUserSubscriptions = function(client, user, req, res, next) {

    var query = client.query({
        text: 'SELECT * FROM user_subscriptions WHERE user__key = $1',
        values: [ user._key ]
    });

    query.on('error', function(err) {
        console.error("user subscriptions select query error = " + err);
        res.send(500, { message: "query error = " + String(err) });
    });

    var neighborhoods = [];
    query.on('row', function(row) {
        neighborhoods.push(row.neighborhood);
    });

    query.on('end', function(result) {

        var query = client.query({
            text: 'DELETE FROM user_subscriptions WHERE user__key = $1',
            values: [ user._key ]
        });
        
        query.on('error', function(err) {
            console.error("user subscriptions delete query error = " + err);
            res.send(500, { message: "query error = " + String(err) });
        });
        
        query.on('end', function(result) {
            res.send({
                message: "All subscriptions for " + user.email_address + " deleted.",
                neighborhoods: neighborhoods
            });
        });
    
    });

}
