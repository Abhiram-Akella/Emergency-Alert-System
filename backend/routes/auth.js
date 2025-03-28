const express = require("express");
const { register, login ,getloggedUser, requestPasswordReset, resetPassword, logout} = require("../controllers/authControllers");
var router = express.Router();
const authenticate = require("../middlewares/authMiddleware");

// Register a new user
router.post("/register", register);

// Login a user
router.post("/login", login);

// Get logged in user details
router.get("/user", authenticate, getloggedUser);


// Logout a user
router.get("/logout", logout);

// Forgot password
router.post("/forgot-password", requestPasswordReset);
router.post("/reset-password/:token", resetPassword);

module.exports = router;