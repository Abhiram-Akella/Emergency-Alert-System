const User = require("../models/schema");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const sendEmail = require("../config/email");
require("dotenv").config();

// Register controller
const register = async (req, res) => {
  try {
    const {
      name,email,password,phone,latitude,longitude,role,responderType,adminPassKey,
    } = req.body;
    const exists = await User.findOne({ email: email });
    if (exists) {
      return res.status(400).json({ error: "Email already exists" });
    }
    if (role === "admin" && adminPassKey !== process.env.ADMIN_PASSKEY) {
      return res.status(400).json({ error: "Invalid admin pass key" });
    }
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const newUser = new User({
      name,
      email,
      password: hashedPassword,
      phone,
      role,
      responderType: role === "responder" ? responderType : undefined,
      location: { latitude, longitude },
    });
    await newUser.save();
    return res.status(201).json({ message: "User created successfully" });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ error: "Error creating user" });
  }
};

// Login Controller
const login = async (req, res) => {
  const { email, password, latitude, longitude } = req.body;
  try {
    const user = await User.findOne({ email: email });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(400).json({ error: "Invalid credentials" });
    }
    if (latitude && longitude) {
      await User.updateOne(
        { _id: user._id },
        { $set: { 'location.latitude': latitude, 'location.longitude': longitude } }
      );
    }
    const token = jwt.sign(
      { id: user._id, role: user.role, name: user.name },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );
    const isProduction = process.env.NODE_ENV === 'production';
    res.cookie("token", token, {
      httpOnly: true,
      maxAge: 3600000, // 1 hour
      sameSite: isProduction ? 'None' : 'Lax',
      secure: isProduction,
    });
    const {_id, name, role} = user;
    return res.status(200).json({ user: { _id, name, role } });
    
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: "Server error", detail: err.message });
  }
};

// Get Logged in User details
const getloggedUser = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password"); // Exclude password
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    return res.status(200).json({"user":user});
  } catch (error) {
    console.error("Error fetching user:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Request password reset
const requestPasswordReset = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({email});
    if(!user){
      return res.status(404).json({message: "User not found"});
    }
    // Generate reset token
    const resetToken = jwt.sign({id: user._id}, process.env.JWT_SECRET, {expiresIn: '10m'});
    // Send email with reset token
    const resetLink = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password/${resetToken}`;
    const htmlContent = `
      <h3>Hi ${user.name},</h3>
      <p>You requested to reset your password. Click <a href="${resetLink}" style="color: #0284c7; text-decoration: underline;">here</a> to reset your password.</p>
      <p>This link will expire in 10 minutes.</p>
      <p>If you didn't request this, please ignore this email.</p>
      <p>Best regards,<br>Emergency Alert System Team</p>
    `;
    await sendEmail(email, 'Reset Password Request', htmlContent);
    res.json({ message: 'Password reset link sent to email' });
  }catch(err){
    console.log(err);
    res.status(500).json({message: "Internal server error"});
  }
}

// Reset password
const resetPassword = async(req,res)=>{
  try{
    const resetToken = req.params.token;
    const {newPassword} = req.body;
    if(!resetToken || !newPassword){
      return res.status(400).json({message: "Invalid reset token or password"});
    }
    const decoded = jwt.verify(resetToken, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);
    if(!user){
      return res.status(404).json({message: "User not found"});
    }
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    user.password = hashedPassword;
    await user.save();
    res.json({message: "Password reset successful"});
  }catch(err){
    console.log(err);
    res.status(500).json({message: "Failed to reset password"});
  }
}

const logout = async (req, res) => {
  const isProduction = process.env.NODE_ENV === 'production';
  res.clearCookie("token", {
    sameSite: isProduction ? 'None' : 'Lax',
    secure: isProduction,
  });
  res.status(200).json({ message: "Logged out successfully" });
}


module.exports = { register, login, getloggedUser, requestPasswordReset, resetPassword, logout};