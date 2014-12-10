var mongoose = require('mongoose'),
    nconf = require('nconf'),
    express = require('express'),
    http = require('http'),
    path = require('path'),
    app = require('./app.js');

//NConf Configuration
nconf.env().file({ file: 'settings.json' });

//Mongoose Configuration
mongoose.connect(nconf.get('database:MONGOHQ_URL'),
    { user: nconf.get('MONGOHQ_USERNAME'), pass: nconf.get('MONGOHQ_PASSWORD') });
mongoose.connection.on('error', function() { console.log("Database error") });
mongoose.connection.once('open', function() { console.log("Database connected") });

//Create Twilio Instance
var twilio = require('twilio')(nconf.get('TWILIO_ACCOUNT_SID'), nconf.get('TWILIO_AUTH_TOKEN'));

twilio.conferences.list(function (err, data) {
    data.conferences.forEach(function (conference) {
//        console.log(JSON.stringify(conference));
        twilio.conferences(conference.sid).participants.list(function (err, data) {
            data.participants.forEach(function (participant) {
                console.log(JSON.stringify(participant));
            });
        });
    });
});

//Server Creation
http.createServer(app).listen(app.get('port'), function(){
  console.log("Express server listening on port " + app.get('port'));
});
