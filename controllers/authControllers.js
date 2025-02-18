const User = require('../models/schema');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

// Register controller
const register = async(req,res)=>{
    try{
        // extract details and create a new user
        const {name,email,password,phone,role} = req.body;
        const exists = await User.findOne({email:email});
        if(exists){
          return res.status(400).send("User already exists!");
        }
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        const newUser = new User({
          name,
          email,
          password: hashedPassword,
          phone,
          role
        });
        await newUser.save();
        return res.status(201).send("User created successfully!");
    }catch(err){
        return res.status(500).send("Error creating user!");
    }
};

// Login Controller
const login = async(req,res)=>{
    const {email,password} = req.body;
      try{
        const user = await User.findOne({email:email});
        if(!user || !(await bcrypt.compare(password, user.password))){
          return res.status(400).send("Invalid credentials");
        }
        const token = jwt.sign({id:user._id,role:user.role},process.env.JWT_SECRET,{expiresIn:"1h"});
        res.cookie('token', token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict',
          maxAge: 3600000 // 1 hour
        });
        res.status(200).json({user});
    }catch(err){
      console.error(err.message);
      res.status(500).send("Server error");
    }
}

module.exports = {register,login};
