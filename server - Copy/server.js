const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
dotenv.config();
const db = require("../server");

const authRoutes = require("./routes/authRoutes.js");
const eventRoutes = require("./routes/eventRoutes.js");
const courseRoutes = require("./routes/courseRoutes.js");
const hallRoutes = require("./routes/hallRoutes.js");
const profileRoutes = require("./routes/profileRoutes.js");

const app = express();
app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/courses", courseRoutes);
app.use("/api/halls", hallRoutes);
app.use("/api/staff", profileRoutes);

app.get("/", (req, res) => {
  res.send("✅ Academic Management System API running...");
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
