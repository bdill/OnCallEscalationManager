var historyController = require('../controllers/HistoryController.js'),
    Application = require('../models/Application.js'),
    phoneValidator = require('../validators/PhoneValidator.js'),
    phoneFormatter = require('../formatters/PhoneFormatter.js'),
    q = require('q'),
    moment = require('moment');

exports.handleGet = function (req, res, next) {
    var Name = req.param('appName');
    var status;

    if (!Name) {
        var err = new Error("Application Name cannot be blank.");
        handleError(res, err);
    } else {
        historyController.findAll(Name, function (err, history) {

            console.log("history: " + JSON.stringify(history));

            if (!err) {
                res.status(200);
                status = { Status: "Success", results: history };
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify(status));
            } else {
                handleError(res, err);
            }
        });
    }
}

function handleError(res, err) {
    var status;
    res.status(500);
    status = { Status: "Error", Message: err.message };
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(status));
}