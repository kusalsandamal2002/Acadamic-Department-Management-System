const db = require("../config/db");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
dotenv.config();

// Register User
exports.register = (req, res) => {
  const { name, email, password, role } = req.body;

  if (!name || !email || !password || !role) {
    return res.status(400).json({ message: "All fields are required" });
  }

  db.query("SELECT * FROM users WHERE email = ?", [email], async (err, result) => {
    if (err) return res.status(500).json({ message: err });
    if (result.length > 0) return res.status(400).json({ message: "User already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);

    db.query(
      "INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)",
      [name, email, hashedPassword, role],
      (err2) => {
        if (err2) return res.status(500).json({ message: err2 });
        res.status(201).json({ message: "User registered successfully" });
      }
    );
  });
};

// Login User
exports.login = (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ message: "All fields are required" });

  db.query("SELECT * FROM users WHERE email = ?", [email], async (err, result) => {
    if (err) return res.status(500).json({ message: err });
    if (result.length === 0) return res.status(400).json({ message: "User not found" });

    const user = result[0];
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Incorrect password" });

    const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: "1d" });

    // include name and role for convenience
    res.json({ token, role: user.role, name: user.name });
  });
};

// Get Logged-in User Profile (via JWT)
exports.getProfile = (req, res) => {
  const { id } = req.user; // set by auth middleware
  db.query("SELECT name, email, role FROM users WHERE id = ?", [id], (err, result) => {
    if (err) return res.status(500).json({ message: err });
    if (result.length === 0) return res.status(404).json({ message: "User not found" });
    res.json(result[0]);
  });
};
