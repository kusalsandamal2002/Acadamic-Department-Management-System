const express = require("express");
const router = express.Router();
const { register, login, getProfile, generateOtp } = require("../controllers/authController");
const { verifyToken } = require("../middleware/authMiddleware");

router.post("/register", register);
router.post("/login", login);
router.post("/generate-otp", generateOtp);  // Route is correct
router.get("/profile", verifyToken, getProfile);

module.exports = router;