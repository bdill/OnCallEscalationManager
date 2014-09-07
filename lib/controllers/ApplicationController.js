var mongoose = require('mongoose'),
    Application = require('../models/Application.js'),
    applicationMapper = require('../mappers/ApplicationMapper.js');


// This function will take 2 sets of parameters:
//      name                        String
//      number                      String
//      callback(err, document)     function
// and
//      application                 Application (model)
//      callback(err, document)     function
//
// The function will attempt to add an application model to the database.
// If the parameters passed are the information to go in to the model, the applicationMapper class
// will be used to create a new model before adding it.
exports.add = function (name, number, callback) {
    var application;
    if (typeof name == 'string') {
        applicationMapper.mapModel(name, number, function (mappedApplication) {
            application = mappedApplication;
            application.save(function (err, document) {
                callback(err, document);
            });
        });
    } else if (typeof name == 'object') {
        if (typeof number == 'function') {
            callback = number;
        }
        application = name;
        application.save(function (err, document) {
            callback(err, document);
        });
    }
};