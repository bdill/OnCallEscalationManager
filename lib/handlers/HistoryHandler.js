var applicationController = require('../controllers/ApplicationController.js'),
    Application = require('../models/Application.js'),
    phoneValidator = require('../validators/PhoneValidator.js'),
    phoneFormatter = require('../formatters/PhoneFormatter.js'),
    q = require('q'),
    moment = require('moment');

exports.handleGet = function (req, res, next) {
    var Name = req.param('appName');
    var status;
    q.nfcall(applicationController.findByName, Name)
    .then(function (application) {
        if (!application) {
            throw new Error("Application " + Name + " does not exist.");
        }

        var startDate = req.param('startDate');
        if (startDate) {
            startDate = new moment(new Date(startDate)).utc();
            var segment = findSegment(application.Segments, startDate);
            if (segment) {
                status = { Status: "Success", results: segment };
            } else {
                throw new Error("No segment was found with the start date supplied.");
            }
        } else {
            status = { Status: "Success", results: application.Segments };
        }
        res.status(200);
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify(status));
    })
    .fail(function (err) {
        handleError(res, err);
    })
}

function handleError(res, err) {
    var status;
    res.status(500);
    status = { Status: "Error", Message: err.message };
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(status));
}