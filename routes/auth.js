const express = require("express");
const { register, login ,getloggedUser} = require("../controllers/authControllers");
var router = express.Router();
const authenticate = require("../middlewares/authMiddleware");

// Serve registration page
router.get("/register", function (req, res) {
  res.render("registration", { title: "Register" });
});

/* GET login page */
router.get("/login", function (req, res) {
  res.render("login", { title: "Login" });
});

// Register a new user
router.post("/register", register);

// Login a user
router.post("/login", login);

// Get logged in user details
router.get("/user", authenticate,getloggedUser);

// Log geolocation coordinates
router.post("/log-coords", (req, res) => {
  const { latitude, longitude } = req.body;
  console.log(
    "Received coordinates - Latitude:",
    latitude,
    "Longitude:",
    longitude
  );
  res.status(200).json({ message: "Coordinates received" });
});

// Logout a user
router.get("/logout", (req, res) => {
  res.clearCookie("token");
  res.redirect("/auth/login");
});

module.exports = router;
