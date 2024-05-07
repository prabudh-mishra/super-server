const express = require("express");
const {
  loginUser,
  registerUser,
  getProfile,
  updateProfile,
  deleteProfile,
} = require("../controllers/userController");
const { auth } = require("../middlewares/authMiddleware");
const router = express.Router();

router.post("/", registerUser);
router.post("/login", loginUser);
router.get("/profile", auth, getProfile);
router.post("/:id", auth, updateProfile);
router.delete("/:id", auth, deleteProfile);

module.exports = router;
