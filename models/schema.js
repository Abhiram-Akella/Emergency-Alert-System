var mongoose = require("mongoose");

const userSchema = mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  phone: { type: String, required: true },
  role: {
    type: String,
    enum: ["admin", "user", "responder"],
    default: "user",
  },
  responderType: {
    type: String,
    enum: ["medical", "fire", "crime", "other"],
    required: function() { return this.role === "responder"; }
  },
  location: {
    type: {
      latitude: { type: Number, default: 28.6139 },
      longitude: { type: Number, default: 77.209 },
      address: { type: String, default: "Unknown Location" },
    },
    required: true
  },
  emergencyReports: [
    { type: mongoose.Schema.Types.ObjectId, ref: "EmergencyReport" },
  ], // User's reports
  responderType: { type: String, enum: ["fire", "crime", "medical","other"] }, // New field for responder type
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("User", userSchema);
