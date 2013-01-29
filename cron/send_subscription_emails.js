var pg = require('pg'),
    config = require('config'),
    async = require('async'),
    SendGrid = require('sendgrid').SendGrid;

// Proceed if today is the day to send emails (default = Saturday)
var today = new Date();
if (today.getDay() != (process.env.EMAIL_DAY_INDEX || 6)) {
    console.log("Today is not a good day to send emails. Quitting without sending any emails.");
    process.exit(0);
}

pg.connect(process.env.DATABASE_URL || config.db_connection_string, function(err, client) {
    
    // Get all subscriptions with associated user info
    var query = client.query({
        text: "SELECT us.neighborhood, us.uuid AS subscription_uuid, u.email_address, u.uuid AS user_uuid "
        + "FROM user_subscriptions AS us "
        + "INNER JOIN users AS u ON us.user__key = u._key "
        + "WHERE status = 'VERIFIED'"
    });

    query.on('error', function(err) {
        console.error("get all subscriptions error = " + err);
        process.exit(1);
    });

    var subscriptions = [];
    query.on('row', function(row) {
        subscriptions.push(row);
    });

    query.on('end', function(results) {
        getIncidents(client, subscriptions);
    });

});

var getIncidents = function(client, subscriptions) {

    var oneWeekInMilliseconds = 7 * 24 * 60 * 60 * 1000;
    var oneWeekAgo = new Date(today.getTime() - oneWeekInMilliseconds);

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
                console.error("get neighborhood incidents query error = " + err);
                process.exit(2);
            })

            neighborhoodIncidents[neighborhood] = [];
            query.on('row', function(row) {
                neighborhoodIncidents[neighborhood].push(row);
            });
            
            query.on('end', function(results) {
                callback();
            });
        }
        
    };

    async.forEach(subscriptions, getNeighborhoodIncidents, function(err) {
        
        if (err) {
            console.error('get neighborhood incidents error = ' + err);
        }

        sendEmails(subscriptions, oneWeekAgo, neighborhoodIncidents)
        ;
    });

}

var sendEmails = function(subscriptions, oneWeekAgo, neighborhoodIncidents) {

    var sendEmail = function(subscription, callback) {

        var unsubscriptionLink = config.app_base_uri + 'email-pages/unsubscribe.html?s=' + subscription.subscription_uuid;
        var userUnsubscriptionLink = config.app_base_uri + 'email-pages/unsubscribe.html?u=' + subscription.user_uuid;

        var neighborhood = subscription.neighborhood;
        var emailHtml = '<img src="' + config.app_base_uri + 'images/logo-retina.png" width="740px" />'
            + '<h2>For the week starting ' + oneWeekAgo + '</h2>'
            + '<h3>' +  neighborhood + '</h3>'

        var incidents = neighborhoodIncidents[neighborhood];

        if (incidents.length > 0) {

            emailHtml += '<h4>Incidents this week:</h4>'
                + '<table>'
                + '<thead>'
                + '  <tr>'
                + '    <th>Crime</th><th>Date/Time</th><th>Address</th>'
                + '  </tr>'
                + '</thead>'
                + '<tbody>';
            
            var totalCrimes = 0;
            var totalPropertyCrimes = 0;
            var totalViolentCrimes = 0;
            var propertyCrimes = {};
            var violentCrimes = {};

            for (index in incidents) {
                var incident = incidents[index];
                emailHtml += '  <tr>'
                    + '    <td>' + incident.crime + '</td>'
                    + '    <td>' + incident.incident_timestamp + '</td>'
                    + '    <td>' + incident.street_address + '</td>'
                    + '  </tr>'

                // Add to stats
                ++totalCrimes;
                switch (incident.crime) {
                    case 'AUTO THEFT':
                    case 'THEFT':
                    case 'VANDALISM':
                        ++totalPropertyCrimes;
                        if (!propertyCrimes[incident.crime]) {
                            propertyCrimes[incident.crime] = 0;
                        }
                        ++propertyCrimes[incident.crime];
                        break;
                    case 'AGGRAVATED ASSAULT':
                    case 'BURGLARY':
                    case 'HOMICIDE':
                    case 'ROBBERY':
                    case 'SIMPLE ASSAULT':
                        ++totalViolentCrimes;
                        if (!violentCrimes[incident.crime]) {
                            violentCrimes[incident.crime] = 0;
                        }
                        ++violentCrimes[incident.crime];
                        break;
                }
            }

            emailHtml += '</tbody>'
                + '</table>'
                + '<h4>Crime totals:</h4>'
                + '<ul>'
                + '  <li>Total Crime: ' + totalCrimes + '</li>'
                + '  <li>Property Crime: ' + totalPropertyCrimes + '</li>'
                + '  <ul>';
            
            for (crime in propertyCrimes) {
                emailHtml += '    <li>' + crime + ': ' + propertyCrimes[crime] + '</li>';
            }

            emailHtml += '  </ul>'
                + '  <li>Violent Crime: ' + totalViolentCrimes + '</li>'
                + '  <ul>'

            for (crime in violentCrimes) {
                emailHtml += '    <li>' + crime + ': ' + violentCrimes[crime] + '</li>';
            }
            
            emailHtml += '  </ul>'
                + '</ul>';


        } else {

            emailHtml += '<h4>There were no crime incidents this week!</h4>'

        }
         
        emailHtml += '<p>Louisville Neighborhood Crime Data</p>'
            + '<p><a href="mailto:louisville@codeforamerica.org">Contact Us</a> '
            + '· <a href="' + config.app_base_uri + '">Visit our website</a> '
            + '· <a href="' + unsubscriptionLink + '">Unsubscribe from ' + neighborhood + ' emails</a> '
            + '· <a href="' + userUnsubscriptionLink + '">Unsubscribe from all emails</a></p>';

        // Send the email
        var sendgrid = new SendGrid(process.env.SENDGRID_USERNAME || config.sendgrid.user, process.env.SENDGRID_PASSWORD);
        sendgrid.send({
            to: subscription.email_address,
            from: 'Louisville Neighborhood Crime Data <no-reply@codeforamerica.org>',
            subject: 'Weekly update for ' + neighborhood,
            html: emailHtml
        }, function(success, message) {
            if (!success) {
                console.error('subscription email error = ' + message);
                callback(message);
            } else {
                console.log("Sent email for " + subscription.neighborhood + " to " + subscription.email_address);
                callback();
            }
        });

    }
    
    // For each subscription, send email
    async.forEach(subscriptions, sendEmail, function(err) {
        if (err) {
            console.error("send emails error = " + err);
            process.exit(2);
        }
    });
    
}
      

