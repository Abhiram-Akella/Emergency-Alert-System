const express = require("express");
const { register, login, getloggedUser, requestPasswordReset, resetPassword, logout } = require("../controllers/authControllers");
var router = express.Router();
const authenticate = require("../middlewares/authMiddleware");
const {
  loginLimiter,
  registerLimiter,
  forgotPasswordLimiter,
  resetPasswordLimiter
} = require("../middlewares/rateLimiters");

// Register a new user
router.post("/register", registerLimiter, register);

// Login a user
router.post("/login", loginLimiter, login);

// Get logged in user details
router.get("/user", authenticate, getloggedUser);

// Logout a user
router.get("/logout", logout);

// Forgot password
router.post("/forgot-password", forgotPasswordLimiter, requestPasswordReset);
router.post("/reset-password/:token", resetPasswordLimiter, resetPassword);

module.exports = router;