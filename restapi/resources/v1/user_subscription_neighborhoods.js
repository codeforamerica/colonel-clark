
var pg = require('pg'),
    config = require('config');

exports.put = function(req, res, next) {

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
  
  var user__key = null;
  query.on('row', function(row) {
    user__key = row._key;
  });
  
  query.on('end', function(result) {
    deleteCurrentSubscription(client, user__key, req, res, next);
  });

}

var deleteCurrentSubscription = function(client, user__key, req, res, next) {

  var query = client.query({
    text: 'DELETE FROM user_subscriptions WHERE user__key = $1',
    values: [ user__key ]
  });
  
  query.on('error', function(err) {
    console.error("query error = " + err);
    res.send(500, { message: "query error = " + String(err) });
  });
  
  query.on('end', function(result) {
    insertNewSubscription(client, user__key, req, res, next);
  });
  
}

var insertNewSubscription = function(client, user__key, req, res, next) {

  var num_neighborhoods_added = 0;
  if (Array.isArray(req.body.neighborhoods)) {
    for (index in req.body.neighborhoods) {
      neighborhood = req.body.neighborhoods[index];
      query = client.query({
        text: 'INSERT INTO user_subscriptions (user__key, neighborhood) VALUES ($1, $2)',
        values: [ user__key, neighborhood ]
      });
      
      query.on('error', function(err) {
        console.error("query error = " + err);
        res.send(500, { message: "query error = " + String(err) });
      });
      
      query.on('end', function(result) {
        ++num_neighborhoods_added;
      });
      
    }
  }    
  
  client.on('drain', function() {
    res.send();
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
