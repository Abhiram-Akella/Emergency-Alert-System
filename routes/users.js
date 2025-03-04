var express = require('express');
var router = express.Router();
const {admin,responder,responderType,user,getResponders,getUserReports} = require('../controllers/userControllers');
var authenticate = require('../middlewares/authMiddleware');
var allowedRoles = require('../middlewares/rolesMiddleware');

// Admin Routes
router.get('/admin',authenticate,allowedRoles("admin"),admin);
router.get('/admin/responders',authenticate,allowedRoles("admin"),getResponders);

// Emergency Responder Route
router.get('/responder',authenticate,allowedRoles("admin","responder"),responder);
router.get('/responder/type',authenticate,allowedRoles("admin","responder"),responderType);

// User Routes
router.get('/user',authenticate,allowedRoles("admin","responder","user"),user);
router.get('/user/reports',authenticate,allowedRoles("admin","responder","user"),getUserReports);

module.exports = router;
