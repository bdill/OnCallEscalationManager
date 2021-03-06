var dateUtil = require('../utils/DateUtil.js'),
    moment = require('moment');

// This function takes an application and a segment
//
// validates the segment's start date is before or same as end date.
//
// validates the segments has no overlap with the applications segments.
exports.validateSegment = function (application, newSegment, callback) {
    var err;
    var validPrimary = false, validSecondary = true;
    //set hours,mins,seconds, milliseconds to 0 for the new segment
    newSegment.StartDate = new moment(newSegment.StartDate).hour(0);
    newSegment.EndDate = new moment(newSegment.EndDate).hour(0);
    //check that start is not after end date.
    if (newSegment.StartDate.isAfter(newSegment.EndDate)) {
        err = new Error("End Date can not be before Start Date.");
        callback(err, newSegment);
        return;
    }
    // chcek that there is a Primary.
    if (!newSegment.PrimaryStaff) {
        err = new Error("Must have at least one staff member in segment.");
        callback(err, newSegment);
        return;
    }
    if (newSegment.SecondaryStaff) {
        validSecondary = false;
    }
    // check that the staff members are in the group.
    application.Staff.forEach(function (member) {
        if (member._id == newSegment.PrimaryStaff) {
            validPrimary = true;
        }
        if (!validSecondary) {
            if (member._id == newSegment.SecondaryStaff) {
                validSecondary = true;
            }
        }
    });
    if (!validPrimary || !validSecondary) {
        if (!validPrimary) {
            err = new Error("Primary On-call staff must belong to the group");
        } else {
            err = new Error("Secondary On-call staff must belong to the group");
        }
        callback(err, newSegment);
        return;
    }
    // Loop through segments and see if there is any overlap
    application.Segments.forEach(function (s) {
        var startDate = new moment(s.StartDate);
        var endDate = new moment(s.EndDate);
        endDate.hour(0);
        startDate.hour(0);
        // check if new segments start date is inside other segment
        if (dateUtil.between(newSegment.StartDate, startDate, endDate) || dateUtil.between(newSegment.EndDate, startDate, endDate)) {
            err = new Error("Segment has overlap with segments already on record.");
        }
    });
    callback(err, newSegment);
};