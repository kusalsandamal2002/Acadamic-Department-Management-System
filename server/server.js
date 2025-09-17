const express = require("express");
const app = express();
const port = 3000;

// Middleware to parse JSON
app.use(express.json());

// Home route
app.get("/", (req, res) => {
  res.send("Welcome to My Express App!");
});

// Example API route
app.get("/api/departments", (req, res) => {
  res.json([
    { id: 1, name: "Computer Science.", head: "Dr. Perera" },
    { id: 2, name: "Electrical Engineering.", head: "Dr. Silva" },
  ]);
});

// Start server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
