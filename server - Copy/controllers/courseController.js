const db = require("../config/db");

export const getCourses = async (req, res) => {
  const [rows] = await db.query("SELECT * FROM courses ORDER BY courseNumber ASC");
  res.json(rows);
};

export const createCourse = async (req, res) => {
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
};

export const updateCourse = async (req, res) => {
  const { id } = req.params;
  const { courseNumber, courseName } = req.body;
  try {
    await db.query("UPDATE courses SET courseNumber=?, courseName=? WHERE id=?", [
      courseNumber,
      courseName,
      id,
    ]);
    res.json({ id, ...req.body });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const deleteCourse = async (req, res) => {
  const { id } = req.params;
  try {
    await db.query("DELETE FROM courses WHERE id=?", [id]);
    res.json({ message: "Deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
