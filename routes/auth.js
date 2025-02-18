const express = require('express');
const jwt = require('jsonwebtoken');
const {register,login} = require('../controllers/authControllers');
var router = express.Router();
var User = require('../models/schema');

// Serve registration page
router.get('/register', function(req, res) {
  res.render('registration', { title: 'Register' });
});

/* GET login page */
router.get('/login', function(req, res) {
    res.render('login', { title: 'Login' });
  });

//Register a new user
router.post('/register', register);

//Login a user
router.post('/login',login);

module.exports = router;
