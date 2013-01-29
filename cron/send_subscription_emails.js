var pg = require('pg'),
    config = require('config'),
    async = require('async'),
    SendGrid = require('sendgrid').SendGrid,
    du = require('date-utils');

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
        console.log('# of subscriptions returned from db = ' + subscriptions.length);
        getIncidents(client, subscriptions);
    });

});

var getIncidents = function(client, subscriptions) {

    var oneWeekAgo = today.clone().addWeeks(-1);

    var neighborhoodIncidents = {};

    var getNeighborhoodIncidents = function(subscription, callback) {
       
        var neighborhood = subscription.neighborhood;
        console.log("Getting incidents for neighborhood = " + neighborhood);
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

        console.log("# of neighborhoods in neighborhood-incidents map: " + Object.keys(neighborhoodIncidents).length);

        sendEmails(subscriptions, oneWeekAgo, neighborhoodIncidents);
    });

}

var sendEmails = function(subscriptions, oneWeekAgo, neighborhoodIncidents) {

    var format = 'DDDD, MMM D';
    var dateRange = oneWeekAgo.toFormat(format) + ' - ' + today.toFormat(format);

    var sendEmail = function(subscription, callback) {

        console.log("Sending email for subscription ID = " + subscription.subscription_uuid);

        var unsubscriptionLink = config.app_base_uri + 'email-pages/unsubscribe.html?s=' + subscription.subscription_uuid;
        var userUnsubscriptionLink = config.app_base_uri + 'email-pages/unsubscribe.html?u=' + subscription.user_uuid;

        var neighborhood = subscription.neighborhood;

        var incidents = neighborhoodIncidents[neighborhood];
        
        // Generate map, if necessary
        if (incidents.length > 0) {
            var mapHtml = '<img width="740" height="300" src="http://maps.googleapis.com/maps/api/staticmap?size=740x300&maptype=roadmap&markers=size:mid%7Ccolor:red'
            for (index in incidents) {
                var incident = incidents[index];
                mapHtml += '%7C' + incident.lat + ',' + incident.lon;
            }
            mapHtml += '&sensor=false">'
        }

        var emailHtml = '<img src="' + config.app_base_uri + 'images/logo-retina.png" width="740px" />'
            + '<h2>During ' + dateRange + '</h2>'
            + '<h3>' +  neighborhood + '</h3>'
            + mapHtml

        if (incidents.length > 0) {
            
            emailHtml += '<table>'
                + '<thead>'
                + '  <tr>'
                + '    <th>Crime</th><th>Date/Time</th><th>Address</th>'
                + '  </tr>'
                + '</thead>'
                + '<tbody>';
            
            for (index in incidents) {
                var incident = incidents[index];
                emailHtml += '  <tr>'
                    + '    <td>' + incident.crime + '</td>'
                    + '    <td>' + incident.incident_timestamp.toFormat(format) + '</td>'
                    + '    <td>' + incident.street_address + '</td>'
                    + '  </tr>'
            }

            emailHtml += '</tbody>'
                + '</table>'
            
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
            from: 'no-reply@codeforamerica.org',
            fromname: 'Louisville Neighborhood Crime Data',
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
      

