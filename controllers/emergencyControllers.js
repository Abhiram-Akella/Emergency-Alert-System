var emergencyReports = require("../models/emergencyreports");

const createReport = async (req, res) => {
  try {
    const { type, description} = req.body;
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
    res.status(201).json({ message: "Emergency report created successfully" });
  } catch (err) {
    console.log(err);
  }
};

module.exports = { createReport };
