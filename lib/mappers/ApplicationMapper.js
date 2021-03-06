var mongoose = require('mongoose'),
    Application = require('../models/Application.js');

// This function takes 1 parameter:
//      application              Application (model) or object with same variables
//
// The function simply creates a new Application Model and 
// maps the parameters to correct fields in the model.  The model
// is then returned
exports.mapModel = function (application) {
    var mappedApplication = new Application();
    if (application._id)
        mappedApplication._id = application._id;
    mappedApplication.Name = application.Name.split(" ").join("_");
    mappedApplication.Phone = application.Phone;
    mappedApplication.Fallback = application.Fallback;
    if (application.Fallback) {
        mappedApplication.Fallback = application.Fallback;
    } else {
        mappedApplication.Fallback = null;
    }
    if (application.Segments) {
        mappedApplication.Segments = JSON.parse(JSON.stringify(application.Segments));
    } else {
        mappedApplication.Segments = [];
    }
    if (application.Staff) {
        mappedApplication.Staff = JSON.parse(JSON.stringify(application.Staff));
    } else {
        mappedApplication.Staff = [];
    }
    return mappedApplication;
};
