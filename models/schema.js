var mongoose = require('mongoose');

const userSchema = mongoose.schema({
    name: {type:String, required:true},
    email: {type:String, required:true},
    password: {type:String, required:true},
    phone: {type:String, required:true},
    role:{
        type:String,
        enum: ['admin', 'user','responder'],
        default: 'user'
    },
    emergencyReports: [{ type: mongoose.Schema.Types.ObjectId, ref: "EmergencyReport" }], // User's reports
    createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("User",userSchema);