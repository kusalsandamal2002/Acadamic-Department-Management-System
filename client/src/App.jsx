// src/App.js
import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/Loginpage";
import RegisterPage from "./pages/RegisterPage";
import LecturerDashboard from "./pages/LecturerDashboard";
import StudentPage from "./pages/StudentPage";

import CourseSection from "./components/dashboard/CourseSection";
import StudentSection from "./components/dashboard/StudentSection";
import LectureHallSection from "./components/dashboard/LectureHallSection";
import ProfileSection from "./components/dashboard/ProfileSection";
import EventsPage from "./components/dashboard/EventsPage"; 

import ProtectedRoute from "./components/ProtectedRoute";

// Simple overview content for the right side when landing on /lecturer
function LecturerOverview() {
  return (
    <div>
      <h2 className="text-2xl font-semibold mb-2">Overview</h2>
      <p className="text-gray-600">
        Welcome! Use the sidebar to manage courses, students, lecture halls, and your profile.
      </p>
    </div>
  );
}

function App() {
  return (
    <Router>
      <Routes>
        {/* Public */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Lecturer (Nested) */}
        <Route
          path="/lecturer"
          element={
            <ProtectedRoute>
              <LecturerDashboard />
            </ProtectedRoute>
          }
        >
          {/* Right-side default content */}
          <Route index element={<LecturerOverview />} />
          <Route path="courses" element={<CourseSection />} />
          <Route path="students" element={<StudentSection />} />
          <Route path="lecture-halls" element={<LectureHallSection />} />
          <Route path="profile" element={<ProfileSection />} />
          <Route path="events" element={<EventsPage />} />
        </Route>

        {/* Student */}
        <Route
          path="/student"
          element={
            <ProtectedRoute>
              <StudentPage />
            </ProtectedRoute>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
