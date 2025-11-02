const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const crypto = require("crypto");
const db = require("../config/db");

// Function to send OTP email
async function sendOtpEmail(email, otp) {
  const transporter = nodemailer.createTransport({
    service: "gmail", // Your email service (e.g., Gmail)
    auth: {
      user: process.env.EMAIL_USER,  // Your email address here
      pass: process.env.EMAIL_PASS,  // Your App Password here (if using 2FA)
    },
  });

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: "Your OTP Code for Registration",
    text: `Your OTP code is: ${otp}`,
  };

  return transporter.sendMail(mailOptions);
}

// Generate OTP and send to user's email (FIXED LOGIC)
async function generateOtp(req, res) {
  const { email } = req.body;
  // Generate a 6-digit OTP as a string
  const otp = crypto.randomInt(100000, 999999).toString();

  try {
    // 1. Check if an account with this email already exists (even if partial/unverified)
    const [existingUser] = await db.query("SELECT id FROM users WHERE email=?", [email]);

    if (existingUser.length > 0) {
      // User found: Update the existing record with the new OTP
      await db.query("UPDATE users SET otp=? WHERE email=?", [otp, email]);
    } else {
      // New User: Insert a temporary record with just the email and OTP
      // NOTE: The DB 'users' table must allow name, password, and role to be NULL for this to work.
      await db.query("INSERT INTO users (email, otp) VALUES (?, ?)", [email, otp]);
    }

    // 2. Send OTP to user's email
    await sendOtpEmail(email, otp);
    res.json({ message: "OTP sent to your email! Proceed with registration." });
  } catch (error) {
    console.error("Error generating or storing OTP:", error);
    res.status(500).json({ error: "Failed to send OTP or server error." });
  }
}

// Handle user registration (MODIFIED LOGIC for robust OTP verification)
async function register(req, res) {
  const { name, email, password, otp, role = "lecturer" } = req.body; 
  
  try {
    // 1. Check if a user record exists and fetch OTP
    const [userRecord] = await db.query("SELECT id, otp, password FROM users WHERE email=?", [email]);

    if (userRecord.length === 0) {
      return res.status(404).json({ error: "User not found. Click 'Send OTP' first." });
    }
    
    // Extract DB OTP and provided OTP
    // Use toString() and trim() for a robust comparison against potential DB type/whitespace issues
    const storedOtp = userRecord[0].otp ? String(userRecord[0].otp).trim() : null;
    const providedOtp = String(otp).trim(); // Ensure client input is also treated as a trimmed string

    // Check if the provided OTP matches the stored OTP
    if (!storedOtp || storedOtp !== providedOtp) { 
        return res.status(400).json({ error: "Invalid OTP" });
    }
    
    // Check if the user is already fully registered
    if (userRecord[0].password) {
         return res.status(400).json({ error: "Email already fully registered" });
    }

    // 2. Proceed with final registration (Update the existing temporary record)
    const hash = await bcrypt.hash(password, 10);
    
    // Update the temporary record with the full user details and hashed password
    await db.query(
      "UPDATE users SET name=?, password=?, role=?, otp=NULL WHERE email=?", 
      [name, hash, role, email] // Set OTP to NULL after successful registration
    );

    res.json({ id: userRecord[0].id, name, email, role });
  } catch (error) {
    console.error("Error during registration:", error);
    res.status(500).json({ error: "Registration failed due to a server error." });
  }
}

// Handle user login
async function login(req, res) {
  try {
    const { email, password } = req.body;
    const [rows] = await db.query("SELECT id,name,email,password,role FROM users WHERE email=?", [email]);
    if (!rows.length) return res.status(400).json({ error: "Invalid credentials" });
    const user = rows[0];
    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(400).json({ error: "Invalid credentials" });
    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: "7d" });
    res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// Get profile info
async function getProfile(req, res) {
  try {
    const [rows] = await db.query("SELECT id,name,email,role FROM users WHERE id=?", [req.user.id]);
    if (!rows.length) return res.status(404).json({ error: "User not found" });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

module.exports = { register, login, generateOtp, getProfile };