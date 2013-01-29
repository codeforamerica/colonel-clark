var pg = require('pg'),
    config = require('config'),
    async = require('async'),
    SendGrid = require('sendgrid').SendGrid,
    du = require('date-utils');

exports.sendEmails = function(subscription, emailSenderCallback) {

    pg.connect(process.env.DATABASE_URL || config.db_connection_string, function(err, client) {

        if (err) {
            emailSenderCallback("database connection error = " + err);
            return;
        }
        
        // Get all subscriptions with associated user info
        var queryText = "SELECT us.neighborhood, us.uuid AS subscription_uuid, u.email_address, u.uuid AS user_uuid "
            + "FROM user_subscriptions AS us "
            + "INNER JOIN users AS u ON us.user__key = u._key "
            + "WHERE us.status = 'VERIFIED'";
        var values = [];

        if (subscription) {
            queryText += " AND us._key = $1";
            values.push(subscription._key);
        }

        var query = client.query({
            text: queryText,
            values: values
        });
        
        query.on('error', function(err) {
            emailSenderCallback("get all subscriptions error = " + err);
            return;
        });
        
        var subscriptions = [];
        query.on('row', function(row) {
            subscriptions.push(row);
        });
        
        query.on('end', function(results) {
            getIncidents(client, subscriptions, emailSenderCallback);
        });
        
    });

}

var getIncidents = function(client, subscriptions, emailSenderCallback) {

    var today = new Date();
    var oneWeekAgo = today.clone().addWeeks(-1);

    var neighborhoodIncidents = {};

    var getNeighborhoodIncidents = function(subscription, callback) {
       
        var neighborhood = subscription.neighborhood;
        if (!neighborhoodIncidents[neighborhood]) {
            
            var query = client.query({
                text: "SELECT * FROM crimes "
                    + "WHERE neighborhood = $1 AND incident_timestamp >= TIMESTAMPTZ 'epoch' + $2 * interval '1 second' "
                    + "ORDER BY incident_timestamp ASC",
                values: [ neighborhood, oneWeekAgo.getTime() / 1000 ]
            });

            query.on('error', function(err) {
                emailSenderCallback("get neighborhood incidents query error = " + err);
                return;
            })

            neighborhoodIncidents[neighborhood] = [];
            query.on('row', function(row) {
                neighborhoodIncidents[neighborhood].push(row);
            });
            
            query.on('end', function(results) {
                callback();
            });
        } else {
            callback();
        }
        
    };

    async.forEach(subscriptions, getNeighborhoodIncidents, function(err) {
        
        if (err) {
            emailSenderCallback('get neighborhood incidents error = ' + err);
            return;
        }

        sendEmails(subscriptions, oneWeekAgo, today, neighborhoodIncidents, emailSenderCallback);
    });

}

var sendEmails = function(subscriptions, startDate, endDate, neighborhoodIncidents, emailSenderCallback) {

    var format = 'DDDD, MMM D';
    var dateRange = startDate.toFormat(format) + '–' + endDate.toFormat(format);

    var sendEmail = function(subscription, callback) {

        var unsubscriptionLink = config.app_base_uri + 'email-pages/unsubscribe.html?s=' + subscription.subscription_uuid;
        var userUnsubscriptionLink = config.app_base_uri + 'email-pages/unsubscribe.html?u=' + subscription.user_uuid;

        var neighborhood = subscription.neighborhood;

        var incidents = neighborhoodIncidents[neighborhood];
        
        var emailHtml = '<html>'
            + '<body>'
            + '<img src="' + config.app_base_uri + 'images/logo-retina.png" width="640" height="31" />'
            + '<h1>' + neighborhood + ', ' + dateRange + '</h1>'

        // Generate list and map, if necessary
        if (incidents.length > 0) {
            
            emailHtml += '<table width="100%">'
                + '<thead>'
                + '  <tr>'
                + '    <th align="left">Crime type</th><th align="left">Date/Time</th><th align="left">Address</th>'
                + '  </tr>'
                + '</thead>'
                + '<tbody>';
            
            for (index in incidents) {
                var incident = incidents[index];
                emailHtml += '  <tr>'
                    + '    <td>' + incident.crime + '</td>'
                    + '    <td>' + incident.incident_timestamp.toFormat(format) + '</td>'
                    + '    <td>' + incident.street_address + '</td>'
                    + '  </tr>\n'
            }

            emailHtml += '</tbody>'
                + '</table>'

            var mapHtml = '<p><img width="640" height="300" src="http://maps.googleapis.com/maps/api/staticmap?size=640x300&maptype=roadmap&markers=size:mid%7Ccolor:0xf7941d'
            for (index in incidents) {
                var incident = incidents[index];
                mapHtml += '%7C' + incident.lat + ',' + incident.lon;
            }
            mapHtml += '&sensor=false"></p>';

            emailHtml += mapHtml
            
        } else {

            emailHtml += '<p><br><br>No crime incidents reported this week!<br><br></p>'

        }
         
        emailHtml += '<p>-- <br>Louisville Neighborhood Crime Data<br>'
            + '<a href="mailto:louisville@codeforamerica.org">Contact us</a> '
            + '· <a href="' + config.app_base_uri + '">Visit the website</a> '
            + '· <a href="' + unsubscriptionLink + '">Unsubscribe from ' + neighborhood + ' emails</a> '
            + '· <a href="' + userUnsubscriptionLink + '">Unsubscribe from all emails</a></p>'
            + '</body>'
            + '</html>';

        // Send the email
        var sendgrid = new SendGrid(process.env.SENDGRID_USERNAME || config.sendgrid.user, process.env.SENDGRID_PASSWORD);
        sendgrid.send({
            to: subscription.email_address,
            from: 'no-reply@codeforamerica.org',
            fromname: 'Louisville Neighborhood Crime Data',
            subject: 'Weekly update for ' + neighborhood,
            html: emailHtml
        }, function(success, message) {
            if (!success) {
                callback(message);
            } else {
                console.info("Sent email for " + subscription.neighborhood + " to " + subscription.email_address);
                callback();
            }
        });

    }
    
    // For each subscription, send email
    async.forEach(subscriptions, sendEmail, function(err) {
        if (err) {
            emailSenderCallback("send emails error = " + err);
        } else {
            emailSenderCallback();
        }
    });
    
}
      

