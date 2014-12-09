var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

// TODO This object is an escalation group, let's call it that
var applicationSchema = new Schema({
    Name:           String,
    Phone:          String,
    Fallback:       { type: Schema.Types.ObjectId, ref: 'Staff' },
    Segments:       [
        {
            StartDate:      Date,
            EndDate:        Date,
            PrimaryStaff:   { type: Schema.Types.ObjectId, ref: 'Staff' },
            SecondaryStaff: { type: Schema.Types.ObjectId, ref: 'Staff' }
        }
    ],
    // History fields cause data duplication, but it's needed since history objects may outlive segment objects
    SegmentEditHistory:
                    [
        {
            Action:         String,
            EditDate:       Date, // TODO Or EditTime?
            Editor:         String,
            StartDate:      Date,
            EndDate:        Date,
            PrimaryStaff:   { type: Schema.Types.ObjectId, ref: 'Staff' },
            SecondaryStaff: { type: Schema.Types.ObjectId, ref: 'Staff' }
        }
    ],
    Staff:          [
        { 
            type: Schema.Types.ObjectId, 
            ref: 'Staff' 
        }
    ]
});

module.exports = mongoose.model('Application', applicationSchema, 'Applications');

