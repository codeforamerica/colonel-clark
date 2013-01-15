var nodemailer = require("nodemailer"),
    config = require('config');

var Mailer = function(user, pass) {

    // Properties
    this.user = user;
    this.pass = pass;
    this.transport = null;

    // Methods
    this.getTransport = function() {

	if (this.transport === null) {

	    // create reusable transport method (opens pool of SMTP connections)
	    this.transport = nodemailer.createTransport("SMTP",{
		service: "Gmail",
		auth: {
		    user: this.user,
		    pass: this.pass
		}
	    });

	}

	return this.transport;

    };

    this.sendEmail = function(from, recipients, subject, textBody, htmlBody) {
	
	// setup e-mail data
	var mailOptions = {
	    from: from,
	    to: recipients.join(,),
	    subject: subject,
	    text: textBody,
	    html: htmlBody
	}

	// send mail with defined transport object
	this.getTransport().sendMail(mailOptions, function(err, response){
	    if (err) {
		console.error(err);
	    } else {
		console.log("Message sent: " + response.message);
	    }
	    
	});

    }

    this.done = function() {
	this.transport.close(); // shut down the connection pool, no more messages
	this.transport = null;
    }

}

exports.createMailer = function(user, pass, from, recipients, subject, textBody, htmlBody) {
    return new Mailer(user, pass, from, recipients, subject, textBody, htmlBody);
};
