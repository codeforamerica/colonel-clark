var pg = require('pg'),
    config = require('config');

exports.del = function(req, res, next) {

  pg.connect(process.env.DATABASE_URL || config.db_connection_string, function(err, client) {
    
    if (err) {
      console.error(err);
      res.send(500, { message: String(err) });
    }
  
    checkSubscriptionExists(client, req, res, next);
  
  });

}

var checkSubscriptionExists = function(client, req, res, next) {

    var subscriptionId = req.params.id;

    var query = client.query({
        text: 'SELECT * FROM user_subscriptions WHERE uuid = $1',
        values: [ subscriptionId ]
    });

    query.on('error', function(err) {
        console.error("subscription select query error = " + err);
        res.send(500, { message: "query error = " + String(err) });
    });

    var subscription;
    query.on('row', function(row) {
        subscription = row;
    });
    
    query.on('end', function(result) {
        if (subscription) {
            deleteSubscription(client, subscription, req, res, next);
        } else {
            res.send(200, { message: "Could not find subscription. Nothing to delete." });
        }
    });

}

var deleteSubscription = function(client, subscription, req, res, next) {

    var query = client.query({
        text: 'DELETE FROM user_subscriptions WHERE _key = $1',
        values: [ subscription._key ]
    });

    query.on('error', function(err) {
        console.error("subscription delete query error = " + err);
        res.send(500, { message: "query error = " + String(err) });
    });

    query.on('end', function(result) {
        res.send({
            message: "Subscription to " + subscription.neighborhood + " deleted.",
            neighborhood: subscription.neighborhood
        });
    });
    
}
