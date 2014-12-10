var express = require('express'),
    path = require('path'),
    http = require('http'),
    passport = require('passport'),
    GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;
    nconf = require('nconf');

//NConf Configuration
nconf.env().file({ file: 'settings.json' });

var google_client_id = nconf.get('GOOGLE_CLIENT_ID'),
    google_client_secret = nconf.get('GOOGLE_CLIENT_SECRET');

if (!google_client_id || !google_client_secret) {
    console.log("Google authentication service credentials not set");
}

//From: https://github.com/jaredhanson/passport-google/blob/master/examples/signon/app.js
// Passport session setup.
// To support persistent login sessions, Passport needs to be able to
// serialize users into and deserialize users out of the session. Typically,
// this will be as simple as storing the user ID when serializing, and finding
// the user by ID when deserializing. However, since this example does not
// have a database of user records, the complete Google profile is serialized
// and deserialized.
passport.serializeUser(function(user, done) {
    done(null, user);
});

passport.deserializeUser(function(obj, done) {
    done(null, obj);
});

// Use the GoogleStrategy within Passport.
// Strategies in passport require a `validate` function, which accept
// credentials (in this case, an OpenID identifier and profile), and invoke a
// callback with a user object.
passport.use(new GoogleStrategy({
    prompt: 'select_account',
    clientID: google_client_id,
    clientSecret: google_client_secret,
    callbackURL: nconf.get("host:headURL") + "/auth/google/callback"
//    callbackURL: "http://localhost:3000/auth/google/callback"
    // ************************************************
    //  Comment out one of the following above.
    //  When pushing make sure nconf.get("host:headURL") + "/auth/google/callback"
    //  When running locally use "http://localhost:3000/auth/google/callback"
    // ************************************************
},
    function (accessToken, refreshToken, profile, done) {
        // asynchronous verification, for effect...
        process.nextTick(function () {
            console.log("Authenticated " + profile.displayName);
            if (profile._json.hd == 'bandwidth.com') {
                return done(null, profile);
            } else {
                return done(null, false, { message: 'Only bandwidth.com accounts are allowed.' });
            }
        });
    }
));

//Express Configuration
var app = express();

app.configure(function(){
    app.set('port', process.env.PORT || 3000);
    app.set('views', __dirname + '/html/src');
    app.set('view engine', 'jade');
    app.use(express.favicon());
    //app.use(express.logger('dev'));
    app.use(express.cookieParser());
    app.use(express.urlencoded());
    app.use(express.json());
    app.use(express.methodOverride());
    app.use(express.session({ secret: 'BWOCEM' }));
    // Initialize Passport! Also use passport.session() middleware, to support
    // persistent login sessions (recommended).
    app.use(passport.initialize());
    app.use(passport.session());
    app.use(app.router);
    app.use(express.static(path.join(__dirname, 'html/includes')));
    app.engine('html', require('ejs').renderFile);
});

app.configure('development', function(){
    app.use(express.errorHandler());
});

require('./routes/twilio.js')(app);
require('./routes/Application.js')(app);
require('./routes/Staff.js')(app);
require('./routes/Gui.js')(app);
require('./routes/Auth.js')(app);

module.exports = app;