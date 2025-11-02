const db = require("../config/db");

exports.getEvents = (req, res) => {
  db.query("SELECT * FROM events ORDER BY dateTime ASC", (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
};

exports.createEvent = (req, res) => {
  const { title, date, time, location, description, dateTime } = req.body;
  db.query(
    "INSERT INTO events (title,date,time,location,description,dateTime) VALUES (?,?,?,?,?,?)",
    [title, date, time, location, description, dateTime],
    (err, result) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ id: result.insertId, ...req.body });
    }
  );
};

exports.updateEvent = (req, res) => {
  const { id } = req.params;
  const { title, date, time, location, description, dateTime } = req.body;
  db.query(
    "UPDATE events SET title=?, date=?, time=?, location=?, description=?, dateTime=? WHERE id=?",
    [title, date, time, location, description, dateTime, id],
    (err) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ message: "Updated successfully" });
    }
  );
};

exports.deleteEvent = (req, res) => {
  const { id } = req.params;
  db.query("DELETE FROM events WHERE id=?", [id], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: "Deleted successfully" });
  });
};
