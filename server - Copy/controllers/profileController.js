const db = require("../config/db");

export const getProfile = async (req, res) => {
  try {
    const [rows] = await db.query("SELECT id,name,email,role FROM users WHERE id=?", [req.user.id]);
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const updateProfile = async (req, res) => {
  const { name, title, department, qualification, phone, office, research } = req.body;
  try {
    await db.query("UPDATE users SET name=? WHERE id=?", [name, req.user.id]);
    res.json({ message: "Profile updated successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
