var Incoming = require('../lib/twilio/Incoming.js')

module.exports = function (app) {
    app.post('/calls/incoming', Incoming.handleIncoming);
    app.post('/calls/incoming', Incoming.handleIncoming);
};
