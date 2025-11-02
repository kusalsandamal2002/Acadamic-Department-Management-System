const express = require("express");
const { verifyToken } = require("../middleware/authMiddleware.js");
const { getProfile, updateProfile } = require("../controllers/profileController.js");

const router = express.Router();

router.get("/me", verifyToken, getProfile);
router.patch("/me", verifyToken, updateProfile);

module.exports = router;
