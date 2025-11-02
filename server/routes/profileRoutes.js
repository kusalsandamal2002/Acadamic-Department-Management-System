const express = require("express");
const { verifyToken } = require("../middleware/authMiddleware");
const { getProfile, updateProfile } = require("../controllers/profileController");

const router = express.Router();

// Get the current user's profile
router.get("/me", verifyToken, getProfile);

// Update the current user's profile
router.patch("/me", verifyToken, updateProfile);

module.exports = router;
