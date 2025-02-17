var express = require('express');
var jwt = require('jsonwebtoken');
var router = express.Router();
var User = require('../models/schema');

/* GET users listing. */
router.get('/', function(req, res, next) {
  res.send('respond with a resource');
});

/* GET registration page */
router.get('/register', function(req, res) {
  res.render('registration', { title: 'Register' });
});

/* GET login page */
router.get('/login', function(req, res) {
  res.render('login', { title: 'Login' });
});

// Create a new user / Signup
router.post("/signup",async (req,res)=>{
  try{
    // extract details and create a new user
    const {name,email,password,phone,role} = req.body;
    const exists = await User.findOne({email:email});
    if(exists){
      return res.status(400).send("User already exists!");
    }
    const newUser = new User({
      name,email,password,phone,role
    });
    await newUser.save();

    //JWT Token
    const token = jwt.sign({id:newUser._id,email:newUser.email}, process.env.JWT_SECRET,{expiresIn:"1h"});
    res.json({token,newUser});
  } catch(err){
    console.error(err.message);
    res.status(500).send("Server error");
  }
});

//login user
router.post('/login',async(req,res)=>{
  const {email,password} = req.body;
  try{
    const user = await User.findOne({email:email});
    if(!user || user.password !== password){
      return res.status(400).send("Invalid credentials");
  }
  const token = jwt.sign({id:user._id,email:user.email},process.env.JWT_SECRET,{expiresIn:"1h"});
  res.json({token,user});
}catch{
  console.error(err.message);
  res.status(500).send("Server error");
}
});

module.exports = router;
