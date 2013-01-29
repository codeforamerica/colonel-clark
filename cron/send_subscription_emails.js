var subscriptions = require(__dirname + '/../lib/subscriptions');

// Proceed if today is the day to send emails (default = Saturday)
var today = new Date();
if (today.getDay() != (process.env.EMAIL_DAY_INDEX || 6)) {
    console.warn("Today is not a good day to send emails. Quitting without sending any emails.");
    process.exit(0);
}

subscriptions.sendEmails(null, function(err) {
    if (err) {
        console.log("subscription send emails error = " + err);
        process.exit(1);
    }
});
