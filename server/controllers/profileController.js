const db = require("../config/db");

// --- GET PROFILE ---
async function getProfile(req, res) {
  try {
    // Check if the user is authenticated by verifying req.user.id
    const userId = req.user?.id;
    if (!userId) {
      return res.status(400).json({ error: "User not authenticated" });
    }

    // Query correctly joins 'users' and 'lecturer_profile'
    const [rows] = await db.query(
      `SELECT u.id, u.name, u.email, u.role, 
              l.title, l.department, l.qualification, 
              l.phone, l.office, l.research, l.profileImage 
       FROM users u 
       LEFT JOIN lecturer_profile l ON u.id = l.userId 
       WHERE u.id = ?`,
      [userId]
    );

    // If no user is found, return an appropriate response
    if (!rows.length) {
      return res.status(404).json({ error: "User not found" });
    }

    // Return the first (and only) user profile data
    res.json(rows[0]);
  } catch (err) {
    console.error("[SERVER ERROR] getProfile failed:", err);
    res.status(500).json({ error: "Internal Server Error: " + err.message });
  }
}

// --- UPDATE PROFILE (Transaction-Based Update) ---
async function updateProfile(req, res) {
  const { 
    name, 
    email, 
    title, 
    department, 
    qualification, 
    phone, 
    office, 
    research, 
    profileImage 
  } = req.body;

  // Check if required fields are provided in the request body
  if (!name || !email || !title || !department || !qualification) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  const userId = req.user?.id;
  if (!userId) {
    return res.status(400).json({ error: "User not authenticated" });
  }

  try {
    // Start a transaction to ensure both updates are atomic
    await db.query("START TRANSACTION");

    // 1. Update the USERS table (only name and email belong here)
    const [userUpdateResult] = await db.query(
      "UPDATE users SET name=?, email=? WHERE id=?",
      [name, email, userId]
    );

    // Check if the update was successful
    if (userUpdateResult.affectedRows === 0) {
      // In a real app, you might check if the user exists but skip this if no name/email was actually changed.
    }

    // 2. Update the LECTURER_PROFILE table
    const [profileUpdateResult] = await db.query(
      `UPDATE lecturer_profile 
       SET title=?, department=?, qualification=?, phone=?, office=?, research=?, profileImage=? 
       WHERE userId=?`,
      [
        title, 
        department, 
        qualification, 
        phone, 
        office, 
        research, 
        profileImage, // This is where the long base64 string is saved
        userId
      ]
    );

    // If no rows were updated in the LECTURER_PROFILE table, something went wrong
    if (profileUpdateResult.affectedRows === 0) {
      throw new Error("Failed to update the lecturer profile in the LECTURER_PROFILE table. This user may not have a profile entry yet.");
    }

    // Commit the transaction if both updates were successful
    await db.query("COMMIT");

    res.json({ message: "Profile updated successfully" });
  } catch (err) {
    // Rollback the transaction if any error occurred
    await db.query("ROLLBACK");

    console.error("[SERVER ERROR] updateProfile transaction failed:", err);
    res.status(500).json({ error: "Transaction failed: " + err.message });
  }
}

module.exports = { getProfile, updateProfile };