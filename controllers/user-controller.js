const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");

require("dotenv").config();
// Import the User model
const User = require("../models/User"); // Adjust the path as needed

const SECRET_KEY = process.env.SECRET_KEY;

// Generate JWT Token
const generateToken = (userId) => {
  return jwt.sign({ userId }, SECRET_KEY, { expiresIn: "1h" });
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
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = generateToken(user._id);

    // Store token in HTTP-only cookie
    res.cookie("authToken", token, {
      httpOnly: true,
      secure: true,
      maxAge: 3600000, // 1 hour
    });

    res.status(200).json({ message: "Login successful" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// Logout API
const logout = (req, res) => {
  res.clearCookie("authToken");
  res.status(200).json({ message: "Logout successful" });
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
    const decoded = jwt.verify(token, SECRET_KEY);
    const user = await User.find((u) => u.id === decoded.userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Update user details
    const { address, phone } = req.body;

    if (address) user.address = address;
    if (phone) user.phone = phone;

    res
      .status(200)
      .json({ message: "User details updated successfully", user });
  } catch (error) {
    res.status(401).json({ message: "Invalid token" });
  }
};

module.exports = { signup, login, logout, getProfile, updateUser };
