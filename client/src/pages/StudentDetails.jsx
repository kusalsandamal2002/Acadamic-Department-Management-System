import React from "react";
import StudentSection from "../components/dashboard/StudentSection";

function StudentDetails() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <div className="bg-white shadow-lg rounded-xl p-10 w-96 text-center">
        <h1 className="text-2xl font-bold mb-4 text-indigo-600">Student Details</h1>
        <p className="mb-6 text-gray-700">View and manage student information below.</p>

        <div className="flex flex-col gap-3">
          <StudentSection />
        </div>
      </div>
    </div>
  );
}

export default StudentDetails;
