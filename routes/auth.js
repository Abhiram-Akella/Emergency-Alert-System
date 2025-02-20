const express = require('express');
const {register,login} = require('../controllers/authControllers');
var router = express.Router();

// Serve registration page
router.get('/register', function(req, res) {
  res.render('registration', { title: 'Register' });
});

/* GET login page */
router.get('/login', function(req, res) {
    res.render('login', { title: 'Login' });
  });

// Register a new user
router.post('/register', register);

// Login a user
router.post('/login',login);

// Log geolocation coordinates
router.post('/log-coords', (req, res) => {
  const { latitude, longitude } = req.body;
  console.log('Received coordinates - Latitude:', latitude, 'Longitude:', longitude);
  res.status(200).json({ message: 'Coordinates received' });
});

module.exports = router;
