const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const db = require("../config/db");

async function register(req, res) {
  try {
    const { name, email, password, role = "lecturer" } = req.body;
    const [existing] = await db.query("SELECT id FROM users WHERE email=?", [email]);
    if (existing.length) return res.status(400).json({ error: "Email already registered" });
    const hash = await bcrypt.hash(password, 10);
    const [result] = await db.query(
      "INSERT INTO users (name,email,password,role) VALUES (?,?,?,?)",
      [name, email, hash, role]
    );
    res.json({ id: result.insertId, name, email, role });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

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

async function getProfile(req, res) {
  try {
    const [rows] = await db.query("SELECT id,name,email,role FROM users WHERE id=?", [req.user.id]);
    if (!rows.length) return res.status(404).json({ error: "User not found" });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

module.exports = { register, login, getProfile };