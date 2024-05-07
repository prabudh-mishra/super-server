const jwt = require("jsonwebtoken");
const asynchandler = require("express-async-handler");
const User = require("../models/userModel");

const auth = asynchandler(async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      token = req.headers.authorization.split(" ")[1];
      const decoded = jwt.verify(token, process.env.SOLAR_SENSE_JWT_SECRET);

      req.user = await User.findById(decoded.id).select("-password");
      next();
    } catch (error) {
      res.status(401);
      throw new Error("User not authenticated");
    }
  }

  if (!token) {
    res.status(401);
    throw new Error("User not authenticated: No token provided");
  }
});

module.exports = { auth };
