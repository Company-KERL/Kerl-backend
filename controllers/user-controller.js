const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");

require("dotenv").config();
// Import the User model
const User = require("../models/User"); // Adjust the path as needed

const SECRET_KEY = process.env.SECRET_KEY;

// Generate JWT Token
const generateToken = (userId) => {
  return jwt.sign({ userId }, SECRET_KEY, { expiresIn: "1w" });
};

// Generate Username from name
const generateUsername = async (name) => {
  const base = name.replace(/\s/g, "").toLowerCase();
  let counter = 1;
  let username = base;

  while (await User.exists({ username })) {
    username = `${base}${counter}`;
    counter++;
  }
  return username;
};

// Signup API
const signup = async (req, res) => {
  const { name, email, password, address, phoneNumber } = req.body;

  if (!name || !email || !password) {
    return res
      .status(400)
      .json({ message: "Name, email, and password are required" });
  }

  try {
    const existingUser = await User.findOne({ $or: [{ email }] });
    if (existingUser) {
      return res.status(409).json({ message: "User already exists" });
    }

    const username = await generateUsername(name);
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({
      name,
      username,
      email,
      password: hashedPassword,
      address,
      phone: phoneNumber,
    });
    await newUser.save();

    res.status(201).json({ message: "User registered successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// Login API
const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required" });
  }

  try {
    const user = await User.findOne({ email }).lean();

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res
        .status(401)
        .json({ message: "Invalid credentials", success: false });
    }

    const token = generateToken(user._id);

    // Store token in HTTP-only cookie
    res.cookie("authToken", token, {
      httpOnly: true,
      // secure: true,
      sameSite: "Strict",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 1 week
    });

    res.status(200).json({
      message: "Login successful",
      success: true,
      user: user,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", success: false });
  }
};

// Logout API
const logout = (req, res) => {
  res.clearCookie("authToken", {
    httpOnly: true,
    secure: true,
    sameSite: "Strict",
  });
  res.json({ message: "Logged out successfully" });
};

// Protected Route Example
const getProfile = async (req, res) => {
  const token = req.cookies.authToken;

  if (!token) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    const user = await User.findById(decoded.userId).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({
      message: "Profile data",
      user,
    });
  } catch (error) {
    console.error(error);
    res.status(401).json({ message: "Invalid token" });
  }
};

const updateUser = async (req, res) => {
  const token = req.cookies.authToken;

  if (!token) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    // Verify the token
    const decoded = jwt.verify(token, process.env.SECRET_KEY);

    // Now fetch the full user data from the database using the userId
    const user = await User.findById(decoded.userId).select("-password"); // Exclude the password
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Update user details
    const { address, phone } = req.body;

    if (address) user.address = address;
    if (phone) user.phone = phone;
    user.save();

    res.status(200).json({ message: "User details updated successfully" });
  } catch (error) {
    res.status(401).json({ message: "Invalid token" });
  }
};

const checkAuth = async (req, res) => {
  const token = req.cookies.authToken;
  // console.log(token);
  if (!token) {
    return res.status(401).json({ isLoggedIn: false });
  }

  try {
    const decoded = jwt.verify(token, process.env.SECRET_KEY);

    // Now fetch the full user data from the database using the userId
    const user = await User.findById(decoded.userId).select("-password"); // Exclude the password

    if (!user) {
      return res.status(404).json({ isLoggedIn: false });
    }
    // console.log(user);
    res.json({
      isLoggedIn: true,
      user, // Send the full user data
    });
  } catch (err) {
    console.error(err);
    res.status(401).json({ isLoggedIn: false });
  }
};

const sendResetLink = async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ message: "Email is required" });
  }

  try {
    const user = await User({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Send reset link to user's email
    // ...
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};



module.exports = { signup, login, logout, getProfile, updateUser, checkAuth };
