var segmentValidator = require('../validators/SegmentValidator.js'),
    applicationController = require('../controllers/ApplicationController.js'),
    Application = require('../models/Application.js'),
    phoneValidator = require('../validators/PhoneValidator.js'),
    phoneFormatter = require('../formatters/PhoneFormatter.js'),
    q = require('q');



exports.handleAdd = function (req, res, next) {
    var Name = req.param('appName');
    var status;
    var foundApplication;

    if (Name) {
        applicationController.findByName(Name, function (err, application) {
            if (err) {
                throw err;
            }
            if (!application) {
                throw new Error("Application " + Name + " does not exist.");
            }
            foundApplication = application;
            var startDate = req.param('StartDate');
            var endDate = req.param('EndDate');
            var primary = req.param('Primary');
            var secondary = req.param('Secondary');
            if (startDate && endDate && primary) {
                /*
                var foundStaff;
                q.nfcall(staffController.findByPhoneAndName, staffPhone, staffName)
                .then(function (staff) {
                    foundStaff = staff;
                    return q.nfcall(applicationController.addToStaff, foundApplication._id, staff);
                })
                .then(function (App) {
                    status = { Status: "Success", results: App, id: foundStaff._id };
                    res.setHeader('Content-Type', 'application/json');
                    res.end(JSON.stringify(status));
                })
                .fail(function (err) {
                    handleError(res, err);
                })
                */
            } else {
                if (!startDate) {
                    var err = new Error("No start date was entered.");
                    handleError(res, err);
                } else if (!endDate) {
                    var err = Error("No end date was entered.");
                    handleError(res, err);
                } else if (!primary) {
                    var err = Error("No primary staff member was entered.");
                    handleError(res, err);
                }
            }
        });
    } else {
        var err = new Error("No Application Name Supplied.")
        handleError(res, err);
    }
}

exports.handleDelete = function (req, res) {
    var Name = req.param('appName');
    var status;
    var foundApplication;

    if (Name) {
        applicationController.findByName(Name, function (err, application) {
            if (err) {
                throw err;
            }
            if (!application) {
                throw new Error("Application " + Name + " does not exist.");
            }
            foundApplication = application;
            try {
                var startDate = new Date(req.param('startDate')); 
                if (startDate) {
                    q.nfcall(applicationController.removeSegment, application._id, startDate)
                    .then(function (segment) {
                        status = { Status: "Success", results: segment };
                        res.setHeader('Content-Type', 'application/json');
                        res.end(JSON.stringify(status));
                    })
                    .fail(function (err) {
                        handleError(res, err);
                    })
                } else {
                    if (!startDate) {
                        var err = new Error("No start date was entered.");
                        handleError(res, err);
                    }
                }
            } catch (err) {
                handleError(res, err);
            }
        });
    } else {
        var err = new Error("No Application Name Supplied.")
        handleError(res, err);
    }
}

exports.handleUpdate = function (req, res, next) {
    var Name = req.param('appName');
    var status;
    var foundApplication;

    var newName = req.param('Name');
    var newPhone = req.param('Phone');

    if (Name) {
        applicationController.findByName(Name, function (err, application) {
            if (err) {
                throw err;
            }
            if (!application) {
                throw new Error("Application " + Name + " does not exist.");
            }
            foundApplication = application;
            var staffPhone = req.param('phone');
            if (staffPhone) {
                q.nfcall(phoneValidator.validatePhone, staffPhone)
                .then(function (Phone) {
                    var staffMem;
                    staffPhone = phoneFormatter.digitsToDatabase(Phone);
                    q.nfcall(staffController.findByPhone, staffPhone)
                    .then(function (staff) {
                        if (!staff) {
                            throw new Error("No staff member found with this phone number.");
                        }
                        staffMem = staff;

                        return q.nfcall(phoneValidator.validatePhone, newPhone);
                    })
                    .then(function (NewPhone) {
                        newPhone = phoneFormatter.digitsToDatabase(NewPhone);

                        staffMem.Primary = newPhone;
                        staffMem.Name = newName;

                        try {
                            staffMem.save(function (err, staff) {
                                if (err)
                                    throw err;
                                var status;
                                res.status(200);
                                status = { Status: "Success", id: staff._id, Name: staff.Name };
                                res.setHeader('Content-Type', 'application/json');
                                res.end(JSON.stringify(status));
                            });
                        } catch (err) {
                            throw err;
                        }
                    })
                    .fail(function (err) {
                        handleError(res, err);
                    })
                })
                .fail(function (err) {
                    handleError(res, err);
                })
            } else {
                if (!staffPhone) {
                    var err = new Error("No staff phone number was entered.");
                    handleError(res, err);
                }
            }
        });
    } else {
        var err = new Error("No Application Name Supplied.")
        handleError(res, err);
    }
}

exports.handleGet = function (req, res, next) {
    var Name = req.param('appName');
    var status;
    if (Name) {
        q.nfcall(applicationController.findByName, Name)
        .then(function (application) {
            if (!application) {
                throw new Error("Application " + Name + " does not exist.");
            }
        
            var startDate = req.param('startDate');
            if (startDate) {
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
    } else {
        var err = new Error("No Application Name Supplied.")
        handleError(res, err);
    }
}

function handleError(res, err) {
    var status;
    res.status(500);
    status = { Status: "Error", Message: err.message };
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(status));
}

function findStaffMember(staffList, Phone) {
    var foundStaff = null;
    staffList.forEach(function (staff) {
        if (staff.Primary == Phone) {
            foundStaff = staff;
        }
    });
    return foundStaff;
}

function findSegment(Segments, StartDate) {
    var foundSegment = null;
    Segments.forEach(function (segment) {
        if (segment.StartDate == StartDate) {
            foundSegment = segment;
        }
    });
    return foundSegment;
}