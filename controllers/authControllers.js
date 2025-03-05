const User = require("../models/schema");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
require("dotenv").config();
// Register controller
const register = async (req, res) => {
  try {
    // extract details and create a new user
    const {
      name,
      email,
      password,
      phone,
      latitude,
      longitude,
      role,
      responderType,
      adminPassKey,
    } = req.body;
    const exists = await User.findOne({ email: email });
    if (exists) {
      return res.status(400).redirect("/auth/register?error=invalid");
    }
    if (role === "admin" && adminPassKey !== process.env.ADMIN_PASSKEY) {
      return res.status(400).redirect("/auth/register?adminerror=invalid");
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
    return res.status(201).redirect("/auth/login");
  } catch (err) {
    console.log(err);
    return res.status(500).send("Error creating user!");
  }
};

// Login Controller
const login = async (req, res) => {
  const { email, password, latitude, longitude } = req.body;
  try {
    const user = await User.findOne({ email: email });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(400).redirect("/auth/login?error=invalid");
    }

    if (latitude && longitude) {
      user.location.latitude = latitude;
      user.location.longitude = longitude;
      await user.save();
    }
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );
    res.cookie("token", token, {
      httpOnly: true,
      maxAge: 3600000, // 1 hour
    });

    req.app.locals.io.on("connection", (socket) => {
      socket.on("registerUser", (userId) => {
        if (userId) {
          socket.join(userId); // Users join their own room
          console.log(`User ${userId} joined WebSocket room.`);
          console.log(req.app.locals.io.sockets.adapter.rooms);
        }
      });
    });
    // Redirect based on user role
    switch (user.role) {
      case "admin":
        res.status(200).redirect("/users/admin");
        break;
      case "responder":
        res.status(200).redirect("/users/responder");
        break;
      default:
        res.status(200).redirect("/users/user");
    }
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
};

// Get Logged in User details
const getloggedUser = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password"); // Exclude password
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json(user);
  } catch (error) {
    console.error("Error fetching user:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

module.exports = { register, login, getloggedUser };
