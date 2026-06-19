const rateLimit = require('express-rate-limit');

/**
 * Login: 10 attempts per 15 minutes per IP.
 * Prevents brute-force password attacks.
 */
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many login attempts. Please try again after 15 minutes.' }
});

/**
 * Register: 5 new accounts per hour per IP.
 * Prevents automated account creation / spam.
 */
const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many accounts created from this IP. Please try again after an hour.' }
});

/**
 * Forgot password: 5 requests per hour per IP.
 * Prevents email bombing.
 */
const forgotPasswordLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many password reset requests. Please try again after an hour.' }
});

/**
 * Reset password: 5 attempts per hour per IP.
 * Prevents token brute-force.
 */
const resetPasswordLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many password reset attempts. Please try again after an hour.' }
});

/**
 * Chatbot: 20 messages per minute per IP.
 * Protects Gemini API quota from abuse.
 */
const chatbotLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many chatbot requests. Please slow down.' }
});

/**
 * Distress report: 5 reports per 15 minutes per IP.
 * Anonymous endpoint — needs strict limiting to prevent spam.
 */
const distressLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many distress reports submitted. Please try again after 15 minutes.' }
});

module.exports = {
  loginLimiter,
  registerLimiter,
  forgotPasswordLimiter,
  resetPasswordLimiter,
  chatbotLimiter,
  distressLimiter
};
