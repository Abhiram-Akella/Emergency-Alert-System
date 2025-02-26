var emergencyReports = require("../models/emergencyreports");

// createReport
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
    // Emit event to admins using io.emit
    req.app.locals.io.emit('reportUpdated',{message:"New Report has been created",report:newReport});
    res.status(201).json({ message: "Emergency report created successfully" });
  } catch (err) {
    console.log(err);
  }
};

// Fetch Reports
const fetchReports = async (req,res)=>{
  try{
    const reports = await emergencyReports.find({status:{$ne:"Resolved"}}).populate("user","name").populate("assignedResponder","name");
    res.json(reports);
  }catch(err){
    console.log(err)
    res.status(500).send('Error Fetching Reports');
  }
};

// Assign responder to report
const assignResponder = async (req, res) => {
  try {
    const { id } = req.params;
    const { responderId } = req.body;

    if (!responderId) {
      return res.status(400).json({ error: 'Responder ID is required' });
    }

    const updatedReport = await emergencyReports.findByIdAndUpdate(
      id,
      { 
        assignedResponder: responderId,
        status: 'Assigned'
      },
      { new: true }
    ).populate('assignedResponder', 'name');

    if (!updatedReport) {
      return res.status(404).json({ error: 'Report not found' });
    }
    // Emit event to responders
    req.app.locals.io.emit('reportAssigned',{message:"New Report has been assigned",report:updatedReport});

    res.json({ message: 'Responder assigned successfully', report: updatedReport });
  } catch (err) {
    console.error('Error assigning responder:', err);
    res.status(500).json({ error: 'Failed to assign responder' });
  }
};

// Get reports assigned to current responder
const getAssignedReports = async (req, res) => {
    try {
        const resolvedReports = await emergencyReports.find({ 
            assignedResponder: req.user.id,
            status: "Resolved"
        }).populate('user', 'name').sort({ createdAt: -1 }); // Sort by createdAt descending

        const unresolvedReports = await emergencyReports.find({ 
            assignedResponder: req.user.id,
            status: { $ne: "Resolved" }
        }).populate('user', 'name').sort({ createdAt: -1 }); // Sort by createdAt descending

        res.json({ resolvedReports, unresolvedReports });
    } catch (err) {
        console.error('Error fetching assigned reports:', err);
        res.status(500).json({ error: 'Failed to fetch assigned reports' });
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
        req.app.locals.io.emit('reportStatusUpdated',{message:`Report ${id} is now ${reportStatus}`,report:updatedReport});

        if (!updatedReport) {
            return res.status(404).json({ error: 'Report not found' });
        }

        res.json({ message: 'Status updated successfully', report: updatedReport });
    } catch (err) {
        console.error('Error updating report status:', err);
        res.status(500).json({ error: 'Failed to update status' });
    }
};

module.exports = { 
    createReport, 
    fetchReports, 
    assignResponder,
    getAssignedReports,
    updateReportStatus
}; // export the functions
