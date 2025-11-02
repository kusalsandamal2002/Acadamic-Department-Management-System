const jwt = require("jsonwebtoken");

async function verifyToken(req, res, next) {
  try {
    const rawToken = req.header("Authorization"); // Raw token expected in header
    
    // Extract token, handling the "Bearer " prefix
    let token = null;
    if (rawToken && rawToken.startsWith('Bearer ')) {
      token = rawToken.slice(7, rawToken.length); // Get token after "Bearer "
    } else {
      token = rawToken; // Assume raw token if no "Bearer " prefix
    }
    
    if (!token) return res.status(401).json({ error: "No token provided" });
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { id: decoded.id };
    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}

module.exports = { verifyToken };