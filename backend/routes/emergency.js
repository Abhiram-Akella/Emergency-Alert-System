var express = require("express");
var multer = require("multer");
var authenticate = require("../middlewares/authMiddleware");
const { distressLimiter } = require("../middlewares/rateLimiters");
const {
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
  rejectReport
} = require("../controllers/emergencyControllers");
var router = express.Router();

// Multer configuration for handling file uploads
const storage = multer.memoryStorage(); // Use memory storage for S3 upload
const upload = multer({ 
  storage,
  limits: {
    fileSize: 25 * 1024 * 1024, // 25MB limit (for videos)
  },
  fileFilter: (req, file, cb) => {
    if (
      file.mimetype.startsWith('image/') ||
      file.mimetype.startsWith('video/') ||
      file.mimetype.startsWith('audio/')
    ) {
      if (file.mimetype.startsWith('image/') && file.size > 5 * 1024 * 1024) {
        cb(new Error('Image files must be less than 5MB'), false);
      } else if (file.mimetype.startsWith('video/') && file.size > 25 * 1024 * 1024) {
        cb(new Error('Video files must be less than 25MB'), false);
      } else if (file.mimetype.startsWith('audio/') && file.size > 1024 * 1024) {
        cb(new Error('Audio files must be less than 1MB'), false);
      } else {
        cb(null, true);
      }
    } else {
      cb(new Error('Only image, video, and audio files are allowed!'), false);
    }
  }
});

// Create a report
router.post("/create", authenticate, upload.array("media", 5), createReport);

// withdraw a report
router.post("/:id/withdraw", authenticate, withdrawReport);

// Fetch reports onto dashboard
router.get("/getall", authenticate, fetchReports);

// Fetch all created reports
router.get("/getallreports", fetchAllReports);

// Get available reports for responder
router.get("/available", authenticate, getAvailableReports);

// Accept a report
router.post("/:id/accept", authenticate, acceptReport);

// Reject a report
router.post("/:id/reject", authenticate, rejectReport);

// Assign responder to report by admin
router.post("/:id/assign", authenticate, assignResponder);

// Get assigned reports for responder
router.get("/assigned", authenticate, getAssignedReports);

// Update report status
router.put("/:id/status", authenticate, updateReportStatus);

// Notify nearby users of emergency
router.post("/:reportId/notify-nearby", authenticate, notifyNearbyUsers);

// Create a distress report
router.post("/distress", distressLimiter, upload.array("media", 1), createDistressReport);

module.exports = router;