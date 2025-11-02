const db = require("../config/db");

export const getBookings = async (req, res) => {
  const [rows] = await db.query("SELECT * FROM hall_bookings ORDER BY date ASC");
  res.json(rows);
};

export const createBooking = async (req, res) => {
  const { courseNumber, courseName, lecturerName, hall, date, startTime, endTime } = req.body;
  try {
    const [result] = await db.query(
      "INSERT INTO hall_bookings (courseNumber, courseName, lecturerName, hall, date, startTime, endTime) VALUES (?,?,?,?,?,?,?)",
      [courseNumber, courseName, lecturerName, hall, date, startTime, endTime]
    );
    res.json({ id: result.insertId, ...req.body });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const updateBooking = async (req, res) => {
  const { id } = req.params;
  const { hall, date, startTime, endTime } = req.body;
  try {
    await db.query(
      "UPDATE hall_bookings SET hall=?, date=?, startTime=?, endTime=? WHERE id=?",
      [hall, date, startTime, endTime, id]
    );
    res.json({ id, ...req.body });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const deleteBooking = async (req, res) => {
  const { id } = req.params;
  try {
    await db.query("DELETE FROM hall_bookings WHERE id=?", [id]);
    res.json({ message: "Deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
