var mongoose = require('mongoose'),
    Application = require('../models/Application.js'),
    staffController = require('./StaffController.js'),
    phoneValidator = require('../validators/PhoneValidator.js'),
    phoneFormatter = require('../formatters/PhoneFormatter.js'),
    q = require('q'),
    moment = require('moment');

// TODO Can this be moved to the main requires block?
var twilio = require('twilio')(nconf.get('TWILIO_ACCOUNT_SID'), nconf.get('TWILIO_AUTH_TOKEN'));

// This function will take 1 parameter:
//      callback(err, document)     function
//
// The function will attempt to find all the on call time spent records in the system.
exports.findAll = function (name, callback) {
    name = name.toString().split(" ").join("_");

    Application.findOne({ Name: name }, 'Phone')
    .exec(function (err, phoneNumber) {
        getTimeSpent(phoneNumber.Phone, callback);
//        callback(err, timeSpent);
    });
};

function getTimeSpent(phoneNumber, callback) {
    var calls = [];

    // TODO Bad use of promises as getFromCalls doesn't depend on getToCalls, not sure what I was doing here
    q.nfcall(getToCalls, phoneNumber)
    .then(function(toCalls) {
        calls.push.apply(calls, toCalls);
        return q.nfcall(getFromCalls, phoneNumber);
    })
    .then(function(fromCalls) {
        calls.push.apply(calls, fromCalls);
        callback(null, calls);
    })
    .catch(function (err) {
        console.log(err);
    })
    .done();
}


function getToCalls(phoneNumber, callback) {
    var toCalls = [];

    twilio.calls.list({ to: phoneNumber },
    function (err, data) {
        data.calls.forEach(function (call) {
            toCalls.push({"phoneNumber": call.from, "duration": call.duration});
        });
        callback(err, toCalls);
    });
}

function getFromCalls(phoneNumber, callback) {
    var fromCalls = [];

    twilio.calls.list({ from: phoneNumber },
    function (err, data) {
        data.calls.forEach(function (call) {
            fromCalls.push({"phoneNumber": call.to, "duration": call.duration});
        });
        callback(err, fromCalls);
    });
}