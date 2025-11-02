const jwt = require("jsonwebtoken");

async function verifyToken(req, res, next) {
  try {
    const token = req.header("Authorization"); // raw token expected
    if (!token) return res.status(401).json({ error: "No token provided" });
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { id: decoded.id };
    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}

module.exports = { verifyToken };