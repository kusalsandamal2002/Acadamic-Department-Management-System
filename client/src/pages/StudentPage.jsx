import React from "react";
import { useNavigate } from "react-router-dom";

function StudentPage() {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <div className="bg-white shadow-lg rounded-xl p-10 w-96 text-center">
        <h1 className="text-3xl font-bold mb-4 text-indigo-600">Student Dashboard</h1>
        <p className="mb-6 text-gray-700">
          View your enrolled courses, check schedules, and manage your profile.
        </p>
        <div className="flex flex-col gap-3">
          <button className="bg-blue-500 hover:bg-blue-600 text-white py-2 rounded-md">
            View Courses
          </button>
          <button className="bg-yellow-500 hover:bg-yellow-600 text-white py-2 rounded-md">
            Check Schedule
          </button>
          <button className="bg-gray-500 hover:bg-gray-600 text-white py-2 rounded-md">
            Update Profile
          </button>
          <button
            onClick={handleLogout}
            className="bg-red-500 hover:bg-red-600 text-white py-2 rounded-md"
          >
            Logout
          </button>
        </div>
      </div>
    </div>
  );
}

export default StudentPage;
