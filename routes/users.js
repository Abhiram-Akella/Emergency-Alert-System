var express = require('express');
var router = express.Router();
const {admin,responder,user,getResponders} = require('../controllers/userControllers');
var authenticate = require('../middlewares/authMiddleware');
var allowedRoles = require('../middlewares/rolesMiddleware');

// Admin Routes
router.get('/admin',authenticate,allowedRoles("admin"),admin);
router.get('/admin/responders',authenticate,allowedRoles("admin"),getResponders);

// Emergency Responder Route
router.get('/responder',authenticate,allowedRoles("admin","responder"),responder);

// User Route
router.get('/user',authenticate,allowedRoles("admin","responder","user"),user);

module.exports = router;
