var applicationHandler = require('../lib/handlers/ApplicationHandler.js'),
    staffHandler = require('../lib/handlers/StaffHandler.js'),
    segmentHandler = require('../lib/handlers/SegmentHandler.js')

module.exports = function (app) {

    //Base Application Handling
    app.get('/api/applications/', applicationHandler.handleGet);
    app.get('/api/applications/:appName', applicationHandler.handleGet);
    app.get('/api/applications/:appName/calls', applicationHandler.handleGetCalls);
    app.get('/api/applications/:appName/calls/:conferenceId/participants', applicationHandler.handleGetCallParticipants);
    app.post('/api/applications/', applicationHandler.handleAdd);
    app.delete('/api/applications/:appName', applicationHandler.handleDelete);
    app.put('/api/applications/:appName', applicationHandler.handleUpdate);

    //Application Staff Handling
    app.get('/api/applications/:appName/staff/', staffHandler.handleGet);
    app.get('/api/applications/:appName/staff/:phone', staffHandler.handleGet);
    app.post('/api/applications/:appName/staff/', staffHandler.handleAdd);
    app.delete('/api/applications/:appName/staff/:phone', staffHandler.handleDelete);
    app.put('/api/applications/:appName/staff/:phone', staffHandler.handleUpdate);

    //Application Segments Handling
    app.get('/api/applications/:appName/segments/', segmentHandler.handleGet);
    app.get('/api/applications/:appName/segments/:startDate', segmentHandler.handleGet);
    app.post('/api/applications/:appName/segments/', segmentHandler.handleAdd);
    app.delete('/api/applications/:appName/segments/:startDate', segmentHandler.handleDelete);
    app.put('/api/applications/:appName/segments/:startDate', segmentHandler.handleUpdate);

    function ensureAuthenticated(req, res, next) {
        if (req.isAuthenticated()) { return next(); }
        res.redirect('/login')
    }

};
