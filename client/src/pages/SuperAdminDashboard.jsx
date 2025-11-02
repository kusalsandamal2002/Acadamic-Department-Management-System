import React from "react";
import { useNavigate } from "react-router-dom";

function LecturerDashboard() {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-50">
      <div className="bg-white p-10 rounded-xl shadow-md text-center w-96">
        <h1 className="text-3xl font-bold mb-4 text-green-600">Lecturer Dashboard</h1>
        <p className="mb-6 text-gray-700">
          Add courses, view student details, book lecture halls, and update your profile.
        </p>

        <button
          onClick={handleLogout}
          className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-md"
        >
          Logout
        </button>
      </div>
    </div>
  );
}

export default LecturerDashboard;
