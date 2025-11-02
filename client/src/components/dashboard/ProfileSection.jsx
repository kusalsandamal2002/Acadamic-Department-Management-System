import React, { useEffect, useState } from "react";

export default function ProfileSection() {
  const [lecturer, setLecturer] = useState(null);

  useEffect(() => {
    // Load lecturer data (replace with backend or login data)
    const storedData =
      JSON.parse(localStorage.getItem("lecturerData")) || {
        name: "Dr. Bimsara Jayasinghe",
        title: "Senior Lecturer",
        department: "Department of ICT & Electronics",
        qualification: "Ph.D. in Computer Engineering (University of Colombo)",
        email: "bimsara@uoc.lk",
        phone: "+94 71 234 5678",
        office: "Room 204, Faculty of Engineering, UOC",
        research:
          "IoT systems, embedded computing, AI-based automation, and smart energy monitoring.",
        profileImage:
          "https://cdn-icons-png.flaticon.com/512/3135/3135715.png",
      };
    setLecturer(storedData);
  }, []);

  if (!lecturer) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <p className="text-gray-500 text-lg">Loading profile...</p>
      </div>
    );
  }

  return (
    <div className="p-10 bg-white">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row items-center gap-8 mb-10">
        <img
          src={lecturer.profileImage}
          alt="Lecturer"
          className="w-36 h-36 rounded-full object-cover border-4 border-green-600 shadow-md"
        />
        <div>
          <h1 className="text-3xl font-semibold text-gray-800">
            {lecturer.name}
          </h1>
          <p className="text-green-700 font-medium">{lecturer.title}</p>
          <p className="text-gray-600">{lecturer.department}</p>
        </div>
      </div>

      {/* Information Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-10 text-gray-700">
        {/* Left column */}
        <div>
          <h2 className="text-lg font-semibold text-green-700 mb-3">
            Contact Information
          </h2>
          <p className="mb-2">
            <span className="font-medium">Email:</span> {lecturer.email}
          </p>
          <p className="mb-2">
            <span className="font-medium">Phone:</span> {lecturer.phone}
          </p>
          <p>
            <span className="font-medium">Office:</span> {lecturer.office}
          </p>
        </div>

        {/* Right column */}
        <div>
          <h2 className="text-lg font-semibold text-green-700 mb-3">
            Academic Profile
          </h2>
          <p className="mb-2">
            <span className="font-medium">Qualification:</span>{" "}
            {lecturer.qualification}
          </p>
          <p>
            <span className="font-medium">Research Area:</span>{" "}
            {lecturer.research}
          </p>
        </div>
      </div>

      {/* Edit Button */}
      <div className="mt-10">
        <button className="bg-green-700 hover:bg-green-800 text-white px-6 py-2.5 rounded-lg shadow-md transition font-medium">
          Edit Profile
        </button>
      </div>
    </div>
  );
}
