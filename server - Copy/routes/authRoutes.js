const express = require("express");
const router = express.Router();
const { register, login, getProfile } = require("../controllers/authController");
const verifyToken = require("../middleware/authMiddleware");

// Auth routes
router.post("/register", register);
router.post("/login", login);
router.get("/profile", verifyToken, getProfile); // protected

module.exports = router;
