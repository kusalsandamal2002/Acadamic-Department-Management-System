import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/Loginpage";
import RegisterPage from "./pages/RegisterPage";
import SuperAdminDashboard from "./pages/SuperAdminDashboard";
import LecturerDashboard from "./pages/LecturerDashboard";
import StudentPage from "./pages/StudentPage";
import ProtectedRoute from "./components/ProtectedRoute"; // 👈 import it

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Protected routes 👇 */}
        <Route
          path="/superadmin"
          element={
            <ProtectedRoute>
              <SuperAdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/lecturer"
          element={
            <ProtectedRoute>
              <LecturerDashboard />
            </ProtectedRoute>
          }
        />
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
