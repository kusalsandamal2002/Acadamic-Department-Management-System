const mysql = require("mysql2/promise");
const dotenv = require("dotenv");
dotenv.config();

const db = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "academic_db",
  port: process.env.DB_PORT || 3306,
});

db.getConnection()
  .then(() => console.log("✅ MySQL Connected Successfully"))
  .catch((err) => console.error("❌ Database Connection Failed:", err.message));

module.exports = db;
