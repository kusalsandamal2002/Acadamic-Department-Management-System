const db = require("../config/db");

async function getCourses(req, res) {
  try {
    const [rows] = await db.query("SELECT * FROM courses ORDER BY courseNumber ASC");
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function createCourse(req, res) {
  const { courseNumber, courseName, lecturerName } = req.body;
  try {
    const [result] = await db.query(
      "INSERT INTO courses (courseNumber, courseName, lecturerName) VALUES (?,?,?)",
      [courseNumber, courseName, lecturerName]
    );
    res.json({ id: result.insertId, ...req.body });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function updateCourse(req, res) {
  const { id } = req.params;
  const { courseNumber, courseName, lecturerName } = req.body;
  try {
    await db.query(
      "UPDATE courses SET courseNumber=?, courseName=?, lecturerName=? WHERE id=?",
      [courseNumber, courseName, lecturerName, id]
    );
    res.json({ id, ...req.body });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function deleteCourse(req, res) {
  const { id } = req.params;
  try {
    await db.query("DELETE FROM courses WHERE id=?", [id]);
    res.json({ message: "Deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

module.exports = { getCourses, createCourse, updateCourse, deleteCourse };