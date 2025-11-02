import React from "react";
import { useNavigate } from "react-router-dom";

// Import dashboard components from components/dashboard
import CourseSection from "../components/dashboard/CourseSection";
import StudentSection from "../components/dashboard/StudentSection";
import LectureHallSection from "../components/dashboard/LectureHallSection";
import ProfileSection from "../components/dashboard/ProfileSection";
import LogoutButton from "../components/dashboard/LogoutButton";

function LecturerDashboard() {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <div className="bg-white shadow-lg rounded-xl p-10 w-96 text-center">
        <h1 className="text-3xl font-bold mb-4 text-green-600">Lecturer Dashboard</h1>
        <p className="mb-6 text-gray-700">
          Welcome! Here you can manage your courses, view student details, book lecture halls, and update your profile.
        </p>

        <div className="flex flex-col gap-3">
          <CourseSection />
          <StudentSection />
          <LectureHallSection />
          <ProfileSection />
          <LogoutButton onLogout={handleLogout} />
        </div>
      </div>
    </div>
  );
}

export default LecturerDashboard;
