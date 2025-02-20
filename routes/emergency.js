var express = require("express");
var path = require('path');
var multer = require('multer');
var authenticate = require("../middlewares/authMiddleware");
const { createReport } = require("../controllers/emergencyControllers");
var router = express.Router();

//  Multer Storage Configuration
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/"); // Store files in the 'uploads' folder
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname)); // Unique filename
  },
});

// Multer Middleware
const upload = multer({ storage: storage});

// Get the emergency report page
router.get("/", function (req, res) {
  res.render("report", { title: "Report Emergency" });
});

// Create a report
router.post("/create", authenticate, upload.single("media"), createReport);

module.exports = router;
