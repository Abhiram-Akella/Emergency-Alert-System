const User = require("../models/schema");
const EmergencyReports = require("../models/emergencyreports");
const sendEmail = require("../config/email");
const { sendSMS } = require("../config/sms");
const geolib = require("geolib");
const {uploadFileToS3} = require("./s3");
const path = require("path");
const { v4: uuidv4 } = require("uuid");

// createReport
const createReport = async (req, res) => {
  try {
    const { type, description, latitude, longitude} = req.body;
    const { id } = req.user;
    // Check for existing reports to avoid duplication
    const existingReport = await EmergencyReports.findOne({type:type,status:{$ne:"Resolved"}});
    if(existingReport){
    const isDuplicate = (existingReport)=>{
      const existingLatitude = existingReport.latitude;
      const existingLongitude = existingReport.longitude;
      const distance = geolib.getDistance(
        { latitude, longitude },
        { existingLatitude,existingLongitude});
      return distance <= 100;
    };
      if(isDuplicate){
        return res.status(403).json({ error:"The incident is already reported. Help is on the way!" });
      }
    }
    // Handle file upload to S3
    let mediaUrls = [];
    if (req.files && req.files.length > 0) {
      const uploadPromises = req.files.map(async (file) => {
        const fileExtension = path.extname(file.originalname);
        const key = `reports/${uuidv4()}${fileExtension}`;
        const { s3Response, error } = await uploadFileToS3(file, key);
        if (error) {
          console.error("Error uploading file to S3:", error);
          throw error;
        } else {
          console.log("File uploaded to S3:", s3Response);
        }
        // Get Object URL for the uploaded file
        const objecturl = `https://s3.${process.env.S3_REGION}.amazonaws.com/${process.env.S3_BUCKET_NAME}/${key}`;
        return objecturl;
      });

      mediaUrls = await Promise.all(uploadPromises);
    }

    const newReport = new EmergencyReports({
      user: id,
      type,
      description,
      media: mediaUrls,
      latitude: req.body.latitude,
      longitude: req.body.longitude,
    });
    await newReport.save();
    await User.findByIdAndUpdate(id, {
      $push: { emergencyReports: newReport._id },
    });

    const populatedReport = await EmergencyReports.findById(newReport._id)
      .populate("user", "name")
      .populate("assignedResponder", "name");

    // Emit event to user, admins and responders of matching type
    const responders = await User.find({role: "responder",responderType: type.toLowerCase(),});
    const admins = await User.find({ role: "admin" });

    req.app.locals.io.to(id).emit("newEmergency", {
      message: `Your ${type} emergency has been reported`,
        report: populatedReport,
      });

    responders.forEach((responder) => {
      req.app.locals.io.to(responder._id.toString()).emit("newEmergency", {
        message: `New ${type} emergency reported`,
        report: populatedReport,
      });
    });

    admins.forEach((admin) => {
    req.app.locals.io.to(admin._id.toString()).emit("newEmergency", {
      message: `New ${type} emergency reported`,
      report: populatedReport,
    });
  });

  // //Send Email Notification
  //   const userInfo = await User.findById(id).select("name email");
  //   sendEmail(userInfo.email,`Report ID: ${newReport._id}`,`<h1>Hello ${userInfo.name} !</h1> <p>Thanks for reporting the emergency. Please be assured that our responders will reach the location soon and sort out the issue. Until then please go through our emergency assistance guide for your reference.</p><br> <p> Best Regards, </p><br> <p><b>Emeergency Response Team </b></p>`);

    res.status(200).json({ message: "Emergency report created successfully" });
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Failed to create report" });
  }
};

// Fetch reports
const fetchReports = async (req, res) => {
  try {
    const reports = await EmergencyReports.find({ status: { $ne: "Resolved" } })
      .populate("user", "name")
      .populate("assignedResponder", "name")
      .sort({ createdAt: -1 });
    return res.json({ reports });
  } catch (err) {
    console.log(err);
    res.status(500).json({error:"Error Fetching Reports"});
  }
};

// Fetch All created reports
const fetchAllReports = async (req, res) => {
  try {
    const reports = await EmergencyReports.find()
      .populate("user", "name")
      .populate("assignedResponder", "name")
      .sort({ createdAt: -1 });
    return res.json({ reports });
  } catch (err) {
    console.log(err);
    res.status(500).json({error:"Error Fetching Reports"});
  }
};

// Get available reports for responder
const getAvailableReports = async (req, res) => {
  try {
    const responder = await User.findById(req.user.id);
    if (!responder || responder.role ==='user') {
      return res.status(403).json({ error: "Not authorized" });
    }

    const reports = await EmergencyReports.find({
      $or: [
        { type: new RegExp(responder.responderType, "i") },
        { type: "Other" },
      ],
      status: "Pending",
      rejectedBy: { $ne: responder._id },
      assignedResponder: { $exists: false },
    }).populate("user", "name");

    const reportsWithDistance = reports.map((report) => {
      const distance = geolib.getDistance(
        {
          latitude: responder.location.latitude,
          longitude: responder.location.longitude,
        },
        { latitude: report.latitude, longitude: report.longitude }
      );

      return {
        ...report.toObject(),
        distance,
      };
    });

    reportsWithDistance.sort((a, b) => a.distance - b.distance);

    res.json(reportsWithDistance);
  } catch (err) {
    console.error("Error fetching available reports:", err);
    res.status(500).json({ error: "Failed to fetch available reports" });
  }
};

// Get assigned reports for responder
const getAssignedReports = async (req, res) => {
  try {
    const resolvedReports = await EmergencyReports.find({
      assignedResponder: req.user.id,
      status: "Resolved",
    })
      .populate("user", "name")
      .sort({ createdAt: -1 });

    const unresolvedReports = await EmergencyReports.find({
      assignedResponder: req.user.id,
      status: { $ne: "Resolved" },
    })
      .populate("user", "name")
      .sort({ createdAt: -1 });

    res.json({ resolvedReports, unresolvedReports }); 
  } catch (err) {
    console.error("Error fetching assigned reports:", err);
    res.status(500).json({ error: "Failed to fetch assigned reports" });
  }
};

// Accept a report
const acceptReport = async (req, res) => {
  try {
    const report = await EmergencyReports.findById(req.params.id);
    if (!report) {
      return res.status(404).json({ error: "Report not found" });
    }

    if (report.status !== "Pending") {
      return res.status(400).json({ error: "Report is no longer available" });
    }

    const responder = await User.findById(req.user.id);
    if (!responder || responder.role !== "responder") {
      return res.status(403).json({ error: "Not authorized" });
    }

    report.assignedResponder = responder._id;
    report.status = "Assigned";
    await report.save();

    const populatedReport = await EmergencyReports.findById(report._id)
      .populate("user", "name")
      .populate("assignedResponder", "name");

     // Notify the user who created the report
     if (report.user) {
      req.app.locals.io.to(report.user.toString()).emit("reportAssigned", {
        message: `A responder has been assigned to your emergency`,
        report: populatedReport,
      });
    }

    // Notify admins
    const admins = await User.find({ role: "admin" });
    admins.forEach((admin) => {
      req.app.locals.io.to(admin._id.toString()).emit("reportAssigned", {
        message: `Report has been assigned to ${responder.name}`,
        report: populatedReport,
      });
    });

    res.json({ message: "Report accepted successfully", report: populatedReport });
  } catch (err) {
    console.error("Error accepting report:", err);
    res.status(500).json({ error: "Failed to accept report" });
  }
};

// Reject a report
const rejectReport = async (req, res) => {
  try {
    const report = await EmergencyReports.findById(req.params.id);
    if (!report) {
      return res.status(404).json({ error: "Report not found" });
    }

    const responder = await User.findById(req.user.id);
    if (!responder || responder.role !== "responder") {
      return res.status(403).json({ error: "Not authorized" });
    }

    if (!report.rejectedBy.includes(responder._id)) {
      report.rejectedBy.push(responder._id);
      await report.save();

      const populatedReport = await EmergencyReports.findById(report._id)
        .populate("user", "name")
        .populate("assignedResponder", "name");

      // Notify admins only
      const admins = await User.find({ role: "admin" });
      admins.forEach((admin) => {
        req.app.locals.io.to(admin._id.toString()).emit("reportUpdated", {
          message: `Report rejected by ${responder.name}`,
          report: populatedReport,
        });
      });
    }

    res.json({ message: "Report rejected successfully" });
  } catch (err) {
    console.error("Error rejecting report:", err);
    res.status(500).json({ error: "Failed to reject report" });
  }
};

// Admin to assign responder to report
const assignResponder = async (req, res) => {
  try {
    const { id } = req.params;
    const { responderId } = req.body;

    if (!responderId) {
      return res.status(400).json({ error: "Responder ID is required" });
    }

    const updatedReport = await EmergencyReports.findByIdAndUpdate(
      id,
      {
        assignedResponder: responderId,
        status: "Assigned",
      },
      { new: true }
    ).populate("assignedResponder", "name");

    if (!updatedReport) {
      return res.status(404).json({ error: "Report not found" });
    }

    const populatedReport = await EmergencyReports.findById(updatedReport._id)
      .populate("user", "name")
      .populate("assignedResponder", "name");

    // Notify the user who created the report
    if (updatedReport.user) {
      req.app.locals.io.to(updatedReport.user.toString()).emit("reportAssigned", {
        message: `A responder has been assigned to your emergency`,
        report: populatedReport,
      });
    }

    // Notify the assigned responder
    req.app.locals.io.to(responderId).emit("reportAssigned", {
      message: `You have been assigned to a new emergency`,
      report: populatedReport,
    });

    res.json({
      message: "Responder assigned successfully",
      report: populatedReport,
    });
  } catch (err) {
    console.error("Error assigning responder:", err);
    res.status(500).json({ error: "Failed to assign responder" });
  }
};

// Update report status
const updateReportStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const updatedReport = await EmergencyReports.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    ).populate("assignedResponder", "name");



    if (!updatedReport) {
      return res.status(404).json({ error: "Report not found" });
    }

    const populatedReport = await EmergencyReports.findById(updatedReport._id)
      .populate("user", "name")
      .populate("assignedResponder", "name");
      
    if(status!=='Assigned'){
    // Notify the user who created the report
    if (updatedReport.user) {
      req.app.locals.io.to(updatedReport.user.toString()).emit("reportStatusUpdated", {
        message: `Your emergency report status has been updated to ${status}`,
        report: populatedReport,
      });
    }
    if(status==='Resolved'|| status==='Assigned'){
      updatedReport.updatedAt = Date.now();
      await updatedReport.save();
    }

    // Notify admins
    const admins = await User.find({ role: "admin" });
    admins.forEach((admin) => {
      req.app.locals.io.to(admin._id.toString()).emit("reportStatusUpdated", {
        message: `Report status updated to ${status}`,
        report: populatedReport,
      });
    });
  }
    res.json({ message: "Status updated successfully", report: populatedReport });
  } catch (err) {
    console.error("Error updating report status:", err);
    res.status(500).json({ error: "Failed to update status" });
  }
};

// withdraw a report
const withdrawReport = async (req, res) => {
  try {
    const { id } = req.params;
    const report = await EmergencyReports.findById(id);
    if (!report) {
      return res.status(404).json({ error: "Report not found" });
    }
    await User.updateOne(
      { emergencyReports: id }, 
      { $pull: { emergencyReports: id } }
    );
    // Get admins and assigned responder before deleting the report
    const [admins, responders] = await Promise.all([
      User.find({ role: "admin" }),
      User.find({ role: "responder", responderType:report.type.toLowerCase() })
    ]);
    await EmergencyReports.findByIdAndDelete(id);

    // Notify admins and responders
    admins.forEach((admin) => {
      req.app.locals.io.to(admin._id.toString()).emit("reportWithdrawn", {
        message: "Report has been withdrawn",
        reportId: id
      });
    });

    responders.forEach((responder) => {
      req.app.locals.io.to(responder._id.toString()).emit("reportWithdrawn", {
        message: "Report has been withdrawn",
        reportId: id
      });
    });

    res.status(200).json({ message: "Report withdrawn successfully" });
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Failed to withdraw report" });
  }
}

// Notify nearby users
const notifyNearbyUsers = async (req, res) => {
  try {
    const { reportId } = req.params;
    const { range } = req.body;
    const report = await EmergencyReports.findById(reportId);
    if (!report) {
      return res.status(404).json({ error: "Report not found" });
    }
    const users = await User.find({
      location: { $exists: true },
      "location.latitude": { $ne: null },
      "location.longitude": { $ne: null },
    });

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

    nearbyUsers.forEach((user) => {
      req.app.locals.io.to(user._id.toString()).emit("nearby-alert", {
        message: `A ${report.type} emergency has been reported within ${range}m of your location! Please stay safe.`,
      });
      sendSMS(
        user.phone,
        `Hi ${user.name}, A ${report.type} has been reported within ${range}m to your location! Please stay safe.`
      );
    });

    res.status(200).json({ message: "Notifications sent successfully" });
  } catch (err) {
    console.log(err);
    res.status(500).send("Error Notifying Nearby Users");
  }
};

// Create a distress report
const createDistressReport = async (req, res) => {
  try {
    const { latitude, longitude } = req.body;
    
    if (!latitude || !longitude) {
      return res.status(400).json({ message: "Location is required" });
    }

    // Handle audio file upload to S3 if present
    let mediaUrls = [];
    if (req.files && req.files.length > 0) {
      const uploadPromises = req.files.map(async (file) => {
        const fileExtension = path.extname(file.originalname);
        const key = `distress/${uuidv4()}${fileExtension}`;
        const { error } = await uploadFileToS3(file, key);
        if (error) {
          console.error("Error uploading file to S3:", error);
          throw error;
        }
        // Get Object URL for the uploaded file
        const objecturl = `https://s3.${process.env.S3_REGION}.amazonaws.com/${process.env.S3_BUCKET_NAME}/${key}`;
        return objecturl;
      });

      mediaUrls = await Promise.all(uploadPromises);
    }

    const newReport = new EmergencyReports({
      user: null,
      type: "Other",
      description: "Triggering a Distress signal",
      media: mediaUrls,
      latitude,
      longitude,
      status: "Pending",
    });
    await newReport.save();

    const populatedReport = await EmergencyReports.findById(newReport._id)
      .populate("user", "name")
      .populate("assignedResponder", "name");

    // Notify admins and responders
    const [admins, responders] = await Promise.all([
      User.find({ role: "admin" }),
      User.find({ role: "responder" })
    ]);

    // Notify admins and responders
    admins.forEach((admin) => {
      req.app.locals.io.to(admin._id.toString()).emit("reportUpdated", {
        message: "New distress signal received",
        report: populatedReport,
      });
    });

    responders.forEach((responder) => {
      req.app.locals.io.to(responder._id.toString()).emit("reportUpdated", {
        message: "New distress signal received",
        report: populatedReport,
      });
    });

    return res.status(201).json({ message: "Distress signal triggered successfully" });
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Error creating distress report" });
  }
};

module.exports = {
  createReport,
  withdrawReport,
  fetchReports,
  fetchAllReports,
  assignResponder,
  getAssignedReports,
  updateReportStatus,
  notifyNearbyUsers,
  createDistressReport,
  getAvailableReports,
  acceptReport,
  rejectReport,
};