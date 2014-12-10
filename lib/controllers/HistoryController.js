var mongoose = require('mongoose'),
    Application = require('../models/Application.js'),
    staffController = require('./StaffController.js'),
    phoneValidator = require('../validators/PhoneValidator.js'),
    phoneFormatter = require('../formatters/PhoneFormatter.js'),
    q = require('q'),
    moment = require('moment');



// This function will take 1 parameter:
//      callback(err, document)     function
//
// The function will attempt to find all the segment edit history records in the system.
exports.findAll = function (name, callback) {
    name = name.toString().split(" ").join("_");

    Application.findOne({ Name: name }, 'SegmentEditHistory')
    .populate('SegmentEditHistory.PrimaryStaff')
    .populate('SegmentEditHistory.SecondaryStaff')
    .exec(function (err, history) {
        callback(err, history);
    });
};
