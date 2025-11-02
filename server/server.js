const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
dotenv.config();

const authRoutes = require("./routes/authRoutes");
const eventRoutes = require("./routes/eventRoutes");
const courseRoutes = require("./routes/courseRoutes");
const hallRoutes = require("./routes/hallRoutes");
const profileRoutes = require("./routes/profileRoutes");

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