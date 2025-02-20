const mongoose = require('mongoose');

const EmergencyReportSchema = new mongoose.Schema({
  user: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User", 
    required: true 
  },
  
  type: { 
    type: String, 
    enum: ["Fire", "Crime", "Medical", "Other"], 
    required: true 
  }, 
  
  description: { 
    type: String, 
    required: true 
  },
  
  media: { 
    type: [String] 
  }, 
  
  latitude:{type: Number,required:true},
  
  longitude:{type:Number,required:true},

  status: { 
    type: String, 
    enum: ["Pending", "In Progress", "Resolved"], 
    default: "Pending" 
  },
  
  assignedResponder: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User" 
  },
  
  createdAt: { 
    type: Date, 
    default: Date.now 
  },
  
  updatedAt: { 
    type: Date, 
    default: Date.now 
  } 
});

// Middleware to update `updatedAt` before saving changes
EmergencyReportSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model("EmergencyReport", EmergencyReportSchema);
