import React from "react";

function StudentDetails() {
  const students = [
    { name: "John Doe", course: "CS101" },
    { name: "Jane Smith", course: "CS102" },
    { name: "Michael Lee", course: "CS103" },
    { name: "Emily Davis", course: "CS104" },
  ];

  return (
    <div className="bg-green-50 p-4 rounded-lg shadow-md">
      <h2 className="text-xl font-semibold mb-2 text-green-700">Student Details</h2>
      <ul className="list-disc list-inside text-gray-700">
        {students.map((student, index) => (
          <li key={index}>
            {student.name} - {student.course}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default StudentDetails;
