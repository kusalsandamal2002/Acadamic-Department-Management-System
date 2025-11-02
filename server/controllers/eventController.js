const db = require("../config/db");

async function getEvents(req, res) {
  try {
    const [rows] = await db.query("SELECT * FROM events ORDER BY dateTime ASC");
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function createEvent(req, res) {
  const { title, date, time, location, description, dateTime } = req.body;
  try {
    const [result] = await db.query(
      "INSERT INTO events (title,date,time,location,description,dateTime) VALUES (?,?,?,?,?,?)",
      [title, date, time, location, description, dateTime]
    );
    res.json({ id: result.insertId, ...req.body });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function updateEvent(req, res) {
  const { id } = req.params;
  const { title, date, time, location, description, dateTime } = req.body;
  try {
    await db.query(
      "UPDATE events SET title=?, date=?, time=?, location=?, description=?, dateTime=? WHERE id=?",
      [title, date, time, location, description, dateTime, id]
    );
    res.json({ message: "Updated successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function deleteEvent(req, res) {
  const { id } = req.params;
  try {
    await db.query("DELETE FROM events WHERE id=?", [id]);
    res.json({ message: "Deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

module.exports = { getEvents, createEvent, updateEvent, deleteEvent };