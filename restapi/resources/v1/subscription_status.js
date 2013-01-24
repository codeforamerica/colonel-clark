var pg = require('pg'),
    config = require('config');

exports.put = function(req, res, next) {

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
        text: 'SELECT _key FROM user_subscriptions WHERE uuid = $1',
        values: [ subscriptionId ]
    });

    query.on('error', function(err) {
        console.error("subscription select query error = " + err);
        res.send(500, { message: "query error = " + String(err) });
    });

    var subscriptionKey;
    query.on('row', function(row) {
        subscriptionKey = row['_key'];
    });
    
    query.on('end', function(result) {
        if (subscriptionKey) {
            updateSubscriptionStatus(client, subscriptionKey, req, res, next);
        } else {
            res.send(404, { message: "Could not find subscription." });
        }
    });

}

var updateSubscriptionStatus = function(client, subscriptionKey, req, res, next) {

    var subscriptionStatus = req.body.status;

    var query = client.query({
        text: 'UPDATE user_subscriptions SET status = $1 WHERE _key = $2',
        values: [ subscriptionStatus, subscriptionKey ]
    });

    query.on('error', function(err) {
        console.error("subscription status update query error = " + err);
        res.send(500, { message: "query error = " + String(err) });
    });

    query.on('end', function(result) {
        res.send({ message: "Subscription status updated."});
    });
    
}
