var applicationController = require('../controllers/ApplicationController.js'),
    Application = require('../models/Application.js'),
    phoneValidator = require('../validators/PhoneValidator.js'),
    phoneFormatter = require('../formatters/PhoneFormatter.js'),
    applicationValidator = require('../validators/ApplicationValidator.js'),
    applicationMapper = require('../mappers/ApplicationMapper.js'),
    q = require('q'),
    mongoose = require('mongoose');

exports.handleAdd = function (req, res, next) {
    var Name = req.param('Name');
    var Phone = req.param('Phone');
    var Fallback = req.param('Fallback');

    if (Name && Phone) {
        q.nfcall(phoneValidator.validatePhone, Phone)
        .then(function (phone) {
            Phone = phoneFormatter.digitsToDatabase(phone);
            var model = new Application();
            model.Name = Name;
            model.Phone = Phone;
            if (Fallback)
                model.Fallback = new require('mongoose').Types.ObjectId(Fallback.toString().trim());
            model = applicationMapper.mapModel(model);

            return q.nfcall(applicationValidator.validateApplication, model);
        })
        .then(function (app) {
            return q.nfcall(applicationController.add, app)
        })
        .then(function (doc) {
            var status;
            res.status(200);
            status = { Status: "Success", id: doc._id, Name: Name };
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify(status));
        })
        .fail(function (err) {
            handleError(res, err);
        })
    } else {
        var err;
        if (!Name) {
            err = new Error("Application Name cannot be blank.")
        } else if (!Phone) {
            err = new Error("Application Phone Number cannot be blank.")
        }
        handleError(res, err);
    }
}

exports.handleDelete = function (req, res) {
    var Name = req.param('appName');

    applicationController.removeByName(Name, function (err) {
        var status;
        if (err) {
            res.status(500);
            status = { Status: "Error", Message: err };
        } else {
            res.status(200);
            status = { Status: "Success", Identifier: Name };
        }
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify(status));
    });
}

exports.handleUpdate = function (req, res, next) {
    var Name = req.param('appName');
    Name = Name.split(" ").join("_");
    q.nfcall(applicationController.findByName, Name)
    .then(function (application) {
        if (!application) {
            throw new Error("Unable to find an application with the name " + Name + ".");
        }

        var Phone = req.param('Phone');
        var Fallback = req.param('Fallback');

        if (Phone) {
            phoneValidator.validatePhone(Phone, function (err, phone) {
                if (!err) {
                    Phone = phoneFormatter.digitsToDatabase(phone);
                    application.Phone = Phone;
                    if (Fallback) {
                        application.Fallback = Fallback;
                    }

                    application.Name = application.Name.split(" ").join("_");
                    try {
                        application.save(function (err, app) {
                            if (err)
                                throw err;
                            var status;
                            res.status(200);
                            status = { Status: "Success", id: app._id, Name: Name };
                            res.setHeader('Content-Type', 'application/json');
                            res.end(JSON.stringify(status));
                        });
                    } catch (err) {
                        throw err;
                    }
                } else {
                    handleError(res, err);
                }
            });
        } else if (Fallback) {
            application.Fallback = Fallback;
            application.Name = application.Name.split(" ").join("_");
            try {
                application.save(function (err, app) {
                    if (err)
                        throw err;
                    var status;
                    res.status(200);
                    status = { Status: "Success", id: app._id, Name: Name };
                    res.setHeader('Content-Type', 'application/json');
                    res.end(JSON.stringify(status));
                });
            } catch (err) {
                throw err;
            }
        }
    })
    .fail(function (err) {
        handleError(res, err);
    })
}

exports.handleGet = function (req, res) {
    var Name = req.param('appName');
    var status;
    if (Name) {
        applicationController.findByName(Name, function (err, application) {
            if (!err) {
                if (application) {
                    res.status(200);
                    status = { Status: "Success", results: application };
                    res.setHeader('Content-Type', 'application/json');
                    res.end(JSON.stringify(status));
                } else {
                    var err = new Error("No applications found with the name " + Name + ".");
                    handleError(res, err);
                }
            } else {
                handleError(res, err);
            }
        });
    } else {
        applicationController.findAll(function (err, applications) {
            if (!err) {
                res.status(200);
                status = { Status: "Success", results: applications };
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify(status));
            } else {
                handleError(res, err);
            }
        });
    }
}

// TODO Twilio calls should probably be at the controller level
exports.handleGetCalls = function (req, res) {
    // TODO Bad location for a require statment
    var twilio = require('twilio')(nconf.get('TWILIO_ACCOUNT_SID'), nconf.get('TWILIO_AUTH_TOKEN'));
    var Name = req.param('appName');
    var status;
    if (Name) {
        twilio.conferences.list({ Status: "in-progress" }, function(err, data) {
            if (!err) {
                res.status(200);
                status = { Status: "Success", results: data };
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify(status));
            } else {
                handleError(res, err);
            }
        });
    }
}

exports.handleGetCallParticipants = function (req, res) {
    // TODO Move require up
    var twilio = require('twilio')(nconf.get('TWILIO_ACCOUNT_SID'), nconf.get('TWILIO_AUTH_TOKEN'));
    var Name = req.param('appName');
    var ConferenceId = req.param('conferenceId');
    var status;
    if (Name && ConferenceId) {
        var conferencePhoneNumber;
        // TODO Copied from above, I am a bad person
        applicationController.findByName(Name, function (err, application) {
            if (!err) {
                if (application) {
                    console.log("application: " + application);
                    conferencePhoneNumber = application.Phone;
                } else {
                    var err = new Error("No applications found with the name " + Name + ".");
                    handleError(res, err);
                }
            } else {
                handleError(res, err);
            }
        });

        twilio.conferences(ConferenceId).participants.list(function(err, data) {
            if (!err) {
                parseParticipants(data.participants, conferencePhoneNumber, function(participantNumberList) {
                    res.status(200);
                    status = { Status: "Success", results: participantNumberList };
                    res.setHeader('Content-Type', 'application/json');
                    res.end(JSON.stringify(status));
                });
            } else {
                handleError(res, err);
            }
        });
    }
}

function parseParticipants(participants, conferencePhoneNumber, callback) {
    var twilio = require('twilio')(nconf.get('TWILIO_ACCOUNT_SID'), nconf.get('TWILIO_AUTH_TOKEN'));
    var promises = [];

    participants.forEach(function (participant) {
        var deferred = q.defer();
        twilio.calls(participant.call_sid).get(function(err, call) {
            if (call.toFormatted == conferencePhoneNumber) {
                deferred.resolve(call.from);
            } else {
                deferred.resolve(call.to);
            }
        });
        promises.push(deferred.promise);
    });

    return q.all(promises).then(function (participantData) {
        callback(participantData);
    }).done();
}

function handleError(res, err) {
    var status;
    res.status(500);
    status = { Status: "Error", Message: err.message };
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(status));
}