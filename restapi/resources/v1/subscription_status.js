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
        text: 'SELECT us._key, us.neighborhood, u.uuid AS user_uuid '
            + 'FROM user_subscriptions AS us '
            + 'INNER JOIN users AS u ON us.user__key = u._key '
            + 'WHERE us.uuid = $1',
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
            updateSubscriptionStatus(client, subscription, req, res, next);
        } else {
            res.send(404, { message: "Could not find subscription." });
        }
    });

}

var updateSubscriptionStatus = function(client, subscription, req, res, next) {

    var subscriptionStatus = req.body.status;

    var query = client.query({
        text: 'UPDATE user_subscriptions SET status = $1 WHERE _key = $2',
        values: [ subscriptionStatus, subscription._key ]
    });

    query.on('error', function(err) {
        console.error("subscription status update query error = " + err);
        res.send(500, { message: "query error = " + String(err) });
    });

    query.on('end', function(result) {
        res.send({
            message: "Subscription status updated.",
            neighborhood: subscription.neighborhood,
            userId: subscription.user_uuid
        });
    });
    
}
