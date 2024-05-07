const asyncHandler = require("express-async-handler");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/userModel");
const Project = require("../models/projectModel");
const Product = require("../models/productModel");

/*
 * @desc    Register new user
 * @route   POST /api/users
 * @access  Public
 */
const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    res.status(400);
    throw new Error("Please enter all fields");
  }

  const userExists = await User.findOne({ email });
  if (userExists) {
    res.status(400);
    throw new Error("User already exists");
  }

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);
  const user = await User.create({
    name,
    email,
    password: hashedPassword,
  });

  if (!user) {
    res.status(400);
    throw new Error("Error creating user");
  }

  res.status(201).json({
    id: user._id,
    name: user.name,
    email: user.email,
    token: generateToken(user._id),
  });
});

/*
 * @desc    Login user
 * @route   POST /api/users/login
 * @access  Public
 */
const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });
  if (!user || !(await bcrypt.compare(password, user.password))) {
    res.status(401);
    throw new Error("Please check your email and password and try again");
  }

  res.status(200).json({
    id: user._id,
    name: user.name,
    email: user.email,
    token: generateToken(user._id),
  });
});

/*
 * @desc    Get user profile
 * @route   GET /api/users/profile
 * @access  Private
 */
const getProfile = asyncHandler(async (req, res) => {
  res.status(200).json(req.user);
});

/*
 * @desc    Update user profile
 * @route   POST /api/users/:id
 * @access  Private
 */
const updateProfile = asyncHandler(async (req, res) => {
  const userId = req.params.id;

  // Check if user is actually updating his/her details
  if (req.user.id.toString() !== userId.toString()) {
    res.status(401);
    throw new Error("User not authorized to update another user's details");
  }

  const userData = req.body;
  const updatedUser = await User.findByIdAndUpdate(userId, userData, {
    returnOriginal: false,
  });

  res.status(200).json({
    id: updatedUser._id,
    name: updatedUser.name,
    email: updatedUser.email,
    token: generateToken(updatedUser._id),
  });
});

/*
 * @desc    Delete user
 * @route   DELETE /api/users/:id
 * @access  Private
 */
const deleteProfile = asyncHandler(async (req, res) => {
  const userId = req.params.id;

  if (!userId) {
    res.status(404);
    throw new Error("User not found");
  }

  // Check if user is actually deleting his/her account
  if (req.user.id.toString() !== userId.toString()) {
    res.status(401);
    throw new Error("User not authorized to delete another user's account");
  }

  // Delete user projects and products from the database
  const userProjects = await Project.find({ user: userId });
  userProjects.forEach(async (project) => {
    await Product.deleteMany({ project: project._id });
  });
  await Project.deleteMany({ user: userId });

  const result = await User.deleteOne({ _id: userId });
  if (result.deletedCount !== 1) {
    res.status(404);
    throw new Error("User account not found");
  }

  res.status(200).json({ message: "Account deleted successfully" });
});

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.SOLAR_SENSE_JWT_SECRET, {
    expiresIn: process.env.SOLAR_SENSE_JWT_EXPIRES_IN,
  });
};

module.exports = {
  registerUser,
  loginUser,
  getProfile,
  updateProfile,
  deleteProfile,
};
