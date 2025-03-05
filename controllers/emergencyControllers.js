var User = require("../models/schema");
var emergencyReports = require("../models/emergencyreports");
const sendEmail = require("../config/email");
const { sendSMS } = require("../config/sms");
const geolib = require("geolib");

// createReport
const createReport = async (req, res) => {
  try {
    const { type, description } = req.body;
    const { id } = req.user;
    const newReport = new emergencyReports({
      user: id,
      type,
      description,
      media: req.file ? req.file.filename : null,
      latitude: req.body.latitude,
      longitude: req.body.longitude,
    });
    await newReport.save();
    await User.findByIdAndUpdate(id, {
      $push: { emergencyReports: newReport._id },
    });
    // Emit event to admins using io.emit
    req.app.locals.io.emit("reportUpdated", {
      message: "New Report has been created",
      report: newReport,
    });
    // Send Email Notification
    // const userInfo = await User.findById(id).select("name email");
    // sendEmail(userInfo.email,`Report ID: ${newReport._id}`,`<h1>Hello ${userInfo.name} !</h1> <p>Thanks for reporting the emergency. Please be assured that our responders will reach the location soon and sort out the issue. Until then please go through our emergency assistance guide for your reference.</p><br> <p> Best Regards, </p><br> <p><b>Emeergency Response Team </b></p>`);
    res.status(201).json({ message: "Emergency report created successfully" });
  } catch (err) {
    console.log(err);
  }
};

// Create Distress Report
const createDistressReport = async (req, res) => {
  try {
    const { latitude, longitude } = req.body;
    if (!latitude || !longitude) {
        return res.status(400).json({ message: "Location is required" });
    }

    // Save distress report
    const newReport = new emergencyReports({
        user:null,
        type: "Other",
        description: "Trigerring a Distress signal",
        media:null,
        latitude,
        longitude,
        status: "Pending",
    });
    await newReport.save();
    // Emit event to admins using io.emit
    req.app.locals.io.emit("reportUpdated", {
      message: "New Report has been created",
      report: newReport,
    });
    res.status(201).json({ message: "Emergency report created successfully" });
}catch(err){
  console.log(err);
  res.status(500).json({ error: "Error creating distress report" });
}
};


// Fetch Reports
const fetchReports = async (req, res) => {
  try {
    const reports = await emergencyReports
      .find({ status: { $ne: "Resolved" } })
      .populate("user", "name")
      .populate("assignedResponder", "name");
    res.json(reports);
  } catch (err) {
    console.log(err);
    res.status(500).send("Error Fetching Reports");
  }
};

// Assign responder to report
const assignResponder = async (req, res) => {
  try {
    const { id } = req.params;
    const { responderId } = req.body;

    if (!responderId) {
      return res.status(400).json({ error: "Responder ID is required" });
    }

    const updatedReport = await emergencyReports
      .findByIdAndUpdate(
        id,
        {
          assignedResponder: responderId,
          status: "Assigned",
        },
        { new: true }
      )
      .populate("assignedResponder", "name");

    if (!updatedReport) {
      return res.status(404).json({ error: "Report not found" });
    }
    // Emit event to responders
    req.app.locals.io.emit("reportAssigned", {
      message: "New Report has been assigned",
      report: updatedReport,
    });

    res.json({
      message: "Responder assigned successfully",
      report: updatedReport,
    });
  } catch (err) {
    console.error("Error assigning responder:", err);
    res.status(500).json({ error: "Failed to assign responder" });
  }
};

// Get reports assigned to current responder
const getAssignedReports = async (req, res) => {
  try {
    const resolvedReports = await emergencyReports
      .find({
        assignedResponder: req.user.id,
        status: "Resolved",
      })
      .populate("user", "name")
      .sort({ createdAt: -1 }); // Sort by createdAt descending

    const unresolvedReports = await emergencyReports
      .find({
        assignedResponder: req.user.id,
        status: { $ne: "Resolved" },
      })
      .populate("user", "name")
      .sort({ createdAt: -1 }); // Sort by createdAt descending

    res.json({ resolvedReports, unresolvedReports });
  } catch (err) {
    console.error("Error fetching assigned reports:", err);
    res.status(500).json({ error: "Failed to fetch assigned reports" });
  }
};

// Update report status
const updateReportStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const updatedReport = await emergencyReports.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    );
    // Collect event status and emit event to all clients having the reports
    let reportStatus = updatedReport.status;
    req.app.locals.io.emit("reportStatusUpdated", {
      message: `Report ${id} is now ${reportStatus}`,
      report: updatedReport,
    });

    // Send Email Notification when report is resolved
    //if (reportStatus === "Resolved") {
    //const userInfo = await emergencyReports.findById(id).populate("user");
    //sendEmail(userInfo.user.email,`Report ID: ${id} Resolved`,`<h2>Hello ${userInfo.user.name} !</h2> <p>This email is to inform you that your report has been resolved and necessary actions have been taken by the responders. We thank you for timely action of reporting the emergency.</p><br> <p>Always remember to raise an emergency in case of any mishaps.</p><br> <p> Best Regards, </p><br> <p><b>Emergency Response Team </b></p>`);
    //}
    if (!updatedReport) {
      return res.status(404).json({ error: "Report not found" });
    }

    res.json({ message: "Status updated successfully", report: updatedReport });
  } catch (err) {
    console.error("Error updating report status:", err);
    res.status(500).json({ error: "Failed to update status" });
  }
};

// Notify nearby users of emergency
const notifyNearbyUsers = async (req, res) => {
  try {
    const { reportId } = req.params;
    const { range } = req.body;
    const report = await emergencyReports.findById(reportId);
    if (!report) {
      return res.status(404).json({ error: "Report not found" });
    }
    const users = await User.find({
      location: { $exists: true },
      "location.latitude": { $ne: null },
      "location.longitude": { $ne: null },
    });

    // Find users within given range
    const nearbyUsers = users.filter(
      (user) =>
        geolib.getDistance(
          { latitude: report.latitude, longitude: report.longitude },
          {
            latitude: user.location.latitude,
            longitude: user.location.longitude,
          }
        ) <= range
    );
    if (nearbyUsers.length === 0) {
      return res
        .status(200)
        .json({ message: `No nearby users within ${range}m radius` });
    }
    // Emit event to nearby users
    console.log("outside of nearby users");

    nearbyUsers.forEach((user) => {
      req.app.locals.io
        .to(user._id.toString())
        .emit("nearby-alert", "hello from nearby");
      //sendEmail(user.email,`Emergency Alert`,`<h2>Hello $user.name} !</h2> <p>This email is to inform you that a ${report.type} has been reported within ${range}m to your location. We advise you to stay alert and take precautionary measures. You can always refer to safety resources present on your dashboard.</p><br> Best Regards, </p><br> <p><b>Emergency Response Team </b></p>`);
        //sendSMS(user.phone, `Hi ${user.name}, A ${report.type} has been reported within ${range}m to your location! Please stay safe.`)
    });
    res.status(200).json({ message: "Notifications sent successfully" });
  } catch (err) {
    console.log(err);
    res.status(500).send("Error Notifying Nearby Users");
  }
};

module.exports = {
  createReport,
  fetchReports,
  assignResponder,
  getAssignedReports,
  updateReportStatus,
  notifyNearbyUsers,
  createDistressReport
}; // export the functions
