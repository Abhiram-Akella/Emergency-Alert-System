var express = require('express');
var router = express.Router();
const {admin,responder,user} = require('../controllers/userControllers');
var authenticate = require('../middlewares/authMiddleware');
var allowedRoles = require('../middlewares/rolesMiddleware');

// Admin Route
router.get('/admin',authenticate,allowedRoles("admin"),admin);

// Emergency Responder Route
router.get('/responder',authenticate,allowedRoles("admin","responder"),responder);

// User Route
router.get('/user',authenticate,allowedRoles("admin","responder","user"),user);

module.exports = router;
