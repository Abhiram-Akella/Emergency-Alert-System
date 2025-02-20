const User = require("../models/schema");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");

// Register controller
const register = async (req, res) => {
  try {
    // extract details and create a new user
    const { name, email, password, phone,latitude,longitude, role } = req.body;
    const exists = await User.findOne({ email: email });
    if (exists) {
      return res.status(400).send("User already exists!");
    }
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const newUser = new User({
      name,
      email,
      password: hashedPassword,
      phone,
      role,
      location: {latitude,longitude},
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
      return res.status(400).send("Invalid credentials");
    }

    if(latitude&&longitude){
      user.location.latitude = latitude;
      user.location.longitude= longitude;
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
    // Redirect based on user role
    switch(user.role) {
      case 'admin':
        res.status(200).redirect('/users/admin');
        break;
      case 'responder':
        res.status(200).redirect('/users/responder');
        break;
      default:
        res.status(200).redirect('/users/user');
    }
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
};

module.exports = { register, login };
