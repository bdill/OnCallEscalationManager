var staffController = require('../controllers/StaffController.js'),
    Staff = require('../models/Staff.js'),
    staffValidator = require('../validators/StaffValidator.js'),
    applicationController = require('../controllers/ApplicationController.js'),
    Application = require('../models/Application.js'),
    phoneValidator = require('../validators/PhoneValidator.js'),
    phoneFormatter = require('../formatters/PhoneFormatter.js'),
    q = require('q');



exports.handleAdd = function (req, res, next) {
    var Name = req.param('appName');
    var status;
    var foundApplication;

    applicationController.findByName(Name, function (err, application) {
        if (err) {
            handleError(res, err);
            return;
        }
        if (!application) {
            var err = new Error("Application " + Name + " does not exist.");
            handleError(res, err);
            return;
        }
        foundApplication = application;
        var staffName = req.param('Name');
        var staffPhone = req.param('Phone');
        if (staffName && staffPhone) {
            q.nfcall(phoneValidator.validatePhone, staffPhone)
            .then(function (Phone) {
                staffPhone = phoneFormatter.digitsToDatabase(Phone);
                return q.nfcall(staffController.staffExists, staffPhone, staffName)
            })
            .then(function (exists) {
                if (!exists) {
                    var addedStaff;
                    var newStaff = new Staff();
                    newStaff.Name = staffName;
                    newStaff.Primary = staffPhone;
                    q.nfcall(staffValidator.validateStaff, newStaff)
                    .then(function (newStaff) {
                        return q.nfcall(staffController.add, newStaff);
                    })
                    .then(function (newStaff) {
                        //Staff added to staff table... now to add it to the application.
                        addedStaff = newStaff;
                        return q.nfcall(applicationController.addToStaff, foundApplication._id, newStaff);
                    })
                    .then(function (App) {
                        status = { Status: "Success", results: App, id: addedStaff._id };
                        res.setHeader('Content-Type', 'application/json');
                        res.end(JSON.stringify(status));
                    })
                    .fail(function (err) {
                        handleError(res, err);
                    })
                } else {
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
                }
            })
            .fail(function (err) {
                handleError(res, err);
            })
        } else {
            if (!staffName) {
                var err = new Error("No staff name was entered.");
                handleError(res, err);
            } else {
                var err = Error("No staff phone number was entered.");
                handleError(res, err);
            }
        }
    });
}

exports.handleDelete = function (req, res) {
    var Name = req.param('appName');
    var status;
    var foundApplication;

    applicationController.findByName(Name, function (err, application) {
        if (err) {
            handleError(res, err);
            return;
        }
        if (!application) {
            var err = new Error("Application " + Name + " does not exist.");
            handleError(res, err);
            return;
        }
        foundApplication = application;
        var staffPhone = req.param('phone');
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
                if(application.Fallback) {
                    if (application.Fallback._id.toString() === staffMem._id.toString()) {
                        application.Fallback = null;
                        application.save(function (err, app) {
                            if (err)
                                throw err;
                        });
                    }
                }
                return q.nfcall(applicationController.removeStaff, application._id, staffMem);
            })
            .then(function (App) {
                status = { Status: "Success", results: App };
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify(status));
            })
            .fail(function (err) {
                handleError(res, err);
            })
        })
        .fail(function (err) {
            handleError(res, err);
        })
    });
}

exports.handleUpdate = function (req, res, next) {
    var Name = req.param('appName');
    var status;
    var foundApplication;

    var newName = req.param('Name');
    var newPhone = req.param('Phone');

    applicationController.findByName(Name, function (err, application) {
        if (err) {
            handleError(res, err);
            return;
        }
        if (!application) {
            var err = new Error("Application " + Name + " does not exist.");
            handleError(res, err);
            return;
        }
        foundApplication = application;
        var staffPhone = req.param('phone');
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
    });
}

exports.handleGet = function (req, res, next) {
    var Name = req.param('appName');
    var status;
    q.nfcall(applicationController.findByName, Name)
    .then(function (application) {
        if (!application) {
            throw new Error("Application " + Name + " does not exist.");
        }

        var staffPhone = req.param('phone');
        if (staffPhone) {
            phoneValidator.validatePhone(staffPhone, function (err, phone) {
                staffPhone = phoneFormatter.digitsToDatabase(phone);
                var staffMember = findStaffMember(application.Staff, staffPhone);
                if (staffMember) {
                    status = { Status: "Success", results: staffMember };
                } else {
                    throw new Error("No staff was found with the number supplied.");
                }
            });
        } else {
            status = { Status: "Success", results: application.Staff };
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

function findStaffMember(staffList, Phone) {
    var foundStaff = null;
    staffList.forEach(function (staff) {
        if (staff.Primary == Phone) {
            foundStaff = staff;
        }
    });
    return foundStaff;
}