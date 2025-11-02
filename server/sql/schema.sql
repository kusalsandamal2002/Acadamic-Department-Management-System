-- Create database (run once)
CREATE DATABASE IF NOT EXISTS academic_db DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE academic_db;

-- Users
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  email VARCHAR(160) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  role VARCHAR(40) DEFAULT 'lecturer',
  title VARCHAR(100),
  department VARCHAR(120),
  qualification VARCHAR(255),
  phone VARCHAR(40),
  office VARCHAR(120),
  research TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Courses
CREATE TABLE IF NOT EXISTS courses (
  id INT AUTO_INCREMENT PRIMARY KEY,
  courseNumber VARCHAR(40) NOT NULL,
  courseName VARCHAR(200) NOT NULL,
  lecturerName VARCHAR(120) NOT NULL
);

-- Events
CREATE TABLE IF NOT EXISTS events (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  date DATE,
  time TIME,
  location VARCHAR(200),
  description TEXT,
  dateTime DATETIME
);

-- Hall bookings
CREATE TABLE IF NOT EXISTS hall_bookings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  courseNumber VARCHAR(40),
  courseName VARCHAR(200),
  lecturerName VARCHAR(120),
  hall VARCHAR(120),
  date DATE,
  startTime TIME,
  endTime TIME
);