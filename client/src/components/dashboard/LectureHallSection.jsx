import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

/** ---------- Helpers ---------- */
const timeToMinutes = (t) => {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
};
const overlaps = (aStart, aEnd, bStart, bEnd) => {
  const A1 = timeToMinutes(aStart);
  const A2 = timeToMinutes(aEnd);
  const B1 = timeToMinutes(bStart);
  const B2 = timeToMinutes(bEnd);
  return Math.max(A1, B1) < Math.min(A2, B2);
};
const sameName = (a = "", b = "") =>
  String(a).trim().toLowerCase() === String(b).trim().toLowerCase();

export default function LectureHallSection() {
  const navigate = useNavigate();

  /** ---------- auth ---------- */
  const [userData, setUserData] = useState({ name: "", role: "" });
  const [loadingUser, setLoadingUser] = useState(true);

  /** ---------- courses + bookings ---------- */
  const [courses, setCourses] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [editingId, setEditingId] = useState(null);

  /** ---------- form ---------- */
  const [formData, setFormData] = useState({
    selectedCourseId: "",
    courseNumber: "",
    courseName: "",
    lecturerName: "",
    hall: "",
    date: "",
    startTime: "",
    endTime: "",
  });

  /** ---------- ui ---------- */
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [loadingBookings, setLoadingBookings] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // ---------- Load user ----------
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return navigate("/login");

    axios
      .get("http://localhost:5000/api/auth/profile", {
        headers: { Authorization: token },
      })
      .then((res) => {
        const data = {
          name: res.data.name || "Lecturer",
          role: res.data.role || "Lecturer",
        };
        setUserData(data);
        localStorage.setItem("userData", JSON.stringify(data));
      })
      .catch(() => {
        localStorage.removeItem("token");
        navigate("/login");
      })
      .finally(() => setLoadingUser(false));
  }, [navigate]);

  // keep lecturerName synced
  useEffect(() => {
    setFormData((p) => ({ ...p, lecturerName: userData.name || "" }));
  }, [userData?.name]);

  // ---------- Load courses (from backend or cache) ----------
  useEffect(() => {
    axios
      .get("http://localhost:5000/api/courses", {
        headers: { Authorization: localStorage.getItem("token") },
      })
      .then((res) => setCourses(res.data))
      .catch((err) =>
        console.error("Course fetch failed:", err?.response?.data || err.message)
      );
  }, []);

  // ---------- Load bookings from backend ----------
  const fetchBookings = () => {
    setLoadingBookings(true);
    axios
      .get("http://localhost:5000/api/halls", {
        headers: { Authorization: localStorage.getItem("token") },
      })
      .then((res) => setBookings(res.data))
      .catch((err) =>
        setError(err.response?.data?.error || "Cannot load hall bookings")
      )
      .finally(() => setLoadingBookings(false));
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  // ---------- Handlers ----------
  const handleChange = (e) => {
    const { name, value } = e.target;
    setError("");
    setSuccess("");
    if (name === "selectedCourseId") {
      const c = courses.find((x) => String(x.id) === String(value));
      setFormData((p) => ({
        ...p,
        selectedCourseId: value,
        courseNumber: c?.courseNumber || "",
        courseName: c?.courseName || "",
      }));
      return;
    }
    setFormData((p) => ({ ...p, [name]: value }));
  };

  const resetForm = () => {
    setFormData({
      selectedCourseId: "",
      courseNumber: "",
      courseName: "",
      lecturerName: userData.name || "",
      hall: "",
      date: "",
      startTime: "",
      endTime: "",
    });
    setEditingId(null);
  };

  const validate = () => {
    const { courseNumber, courseName, lecturerName, hall, date, startTime, endTime } = formData;
    if (!courseNumber || !courseName || !lecturerName || !hall || !date || !startTime || !endTime)
      return "Please complete all fields.";
    if (timeToMinutes(endTime) <= timeToMinutes(startTime))
      return "End time must be after start time.";
    const conflict = bookings.some(
      (b) =>
        b.hall === hall &&
        b.date === date &&
        overlaps(b.startTime, b.endTime, startTime, endTime) &&
        (!editingId || b.id !== editingId)
    );
    if (conflict) return `Time conflict: ${hall} already booked.`;
    return "";
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    const v = validate();
    if (v) return setError(v);

    setSubmitting(true);
    const token = localStorage.getItem("token");

    if (editingId) {
      axios
        .put(`http://localhost:5000/api/halls/${editingId}`, formData, {
          headers: { Authorization: token },
        })
        .then((res) => {
          setBookings((prev) =>
            prev.map((b) => (b.id === editingId ? res.data : b))
          );
          setSuccess("✅ Booking updated successfully.");
          resetForm();
        })
        .catch((err) => setError(err.response?.data?.error || "Update failed."))
        .finally(() => setSubmitting(false));
    } else {
      axios
        .post("http://localhost:5000/api/halls", formData, {
          headers: { Authorization: token },
        })
        .then((res) => {
          setBookings((prev) => [res.data, ...prev]);
          setSuccess("✅ Lecture hall booked successfully.");
          resetForm();
        })
        .catch((err) => setError(err.response?.data?.error || "Booking failed."))
        .finally(() => setSubmitting(false));
    }
  };

  const handleEdit = (b) => {
    if (!sameName(b.lecturerName, userData.name)) return;
    setFormData({
      selectedCourseId: "",
      courseNumber: b.courseNumber,
      courseName: b.courseName,
      lecturerName: b.lecturerName,
      hall: b.hall,
      date: b.date,
      startTime: b.startTime,
      endTime: b.endTime,
    });
    setEditingId(b.id);
  };

  const handleCancel = (id, name) => {
    if (!sameName(name, userData.name)) return setError("Only owner can cancel.");
    axios
      .delete(`http://localhost:5000/api/halls/${id}`, {
        headers: { Authorization: localStorage.getItem("token") },
      })
      .then(() => {
        setBookings((prev) => prev.filter((b) => b.id !== id));
        setSuccess("🗑️ Booking deleted successfully.");
      })
      .catch((err) => setError(err.response?.data?.error || "Delete failed."));
  };

  const sorted = useMemo(
    () => [...bookings].sort((a, b) => a.date.localeCompare(b.date)),
    [bookings]
  );

  // ---------- UI ----------
  return (
    <div className="w-full px-6 py-8">
      <h2 className="text-3xl font-bold text-green-700 mb-4 text-center">
        Lecture Hall Booking
      </h2>
      <p className="text-center text-sm text-gray-600 mb-4">
        Logged in as{" "}
        <span className="font-semibold text-green-700">
          {loadingUser ? "Loading…" : userData.name || "—"}
        </span>
      </p>

      {error && <div className="bg-red-100 text-red-700 p-3 rounded mb-4 text-center">{error}</div>}
      {success && <div className="bg-green-100 text-green-700 p-3 rounded mb-4 text-center">{success}</div>}

      <form onSubmit={handleSubmit} className="space-y-5 max-w-4xl mx-auto">
        <div>
          <label className="block font-semibold mb-1">Select Course</label>
          <select
            name="selectedCourseId"
            value={formData.selectedCourseId}
            onChange={handleChange}
            required
            className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-green-500"
          >
            <option value="">-- Select --</option>
            {courses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.courseNumber} — {c.courseName}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div>
            <label className="block font-semibold mb-1">Course No</label>
            <input
              value={formData.courseNumber}
              readOnly
              className="w-full bg-gray-100 border border-gray-300 rounded-md p-2"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block font-semibold mb-1">Course Name</label>
            <input
              value={formData.courseName}
              readOnly
              className="w-full bg-gray-100 border border-gray-300 rounded-md p-2"
            />
          </div>
        </div>

        <div>
          <label className="block font-semibold mb-1">Lecture Hall</label>
          <select
            name="hall"
            value={formData.hall}
            onChange={handleChange}
            required
            className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-green-500"
          >
            <option value="">-- Select Hall --</option>
            <option value="A101">AG01</option>
            <option value="B202">AG02</option>
            <option value="C303">A101</option>
            <option value="D404">A102</option>
            <option value="D404">A201</option>
            <option value="D404">A202</option>
            <option value="D404">A201</option>
            <option value="D404">MINI Auditorium 1</option>
            <option value="D404">MINI Auditorium 2</option>
            <option value="D404">Mechanical Workshop</option>

          </select>
        </div>
 
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <input
            type="date"
            name="date"
            value={formData.date}
            onChange={handleChange}
            required
            className="border p-2 rounded-md"
          />
          <input
            type="time"
            name="startTime"
            value={formData.startTime}
            onChange={handleChange}
            required
            className="border p-2 rounded-md"
          />
          <input
            type="time"
            name="endTime"
            value={formData.endTime}
            onChange={handleChange}
            required
            className="border p-2 rounded-md"
          />
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="bg-green-600 hover:bg-green-700 text-white py-2 px-6 rounded-md"
        >
          {editingId ? "Update Booking" : "Book Hall"}
        </button>
        {editingId && (
          <button
            type="button"
            onClick={resetForm}
            className="ml-3 border px-4 py-2 rounded-md"
          >
            Cancel Edit
          </button>
        )}
      </form>

      <section className="max-w-6xl mx-auto mt-10">
        <h3 className="text-2xl font-bold text-gray-800 mb-4">Active Bookings</h3>
        {loadingBookings ? (
          <p>Loading…</p>
        ) : sorted.length === 0 ? (
          <p>No bookings found.</p>
        ) : (
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b">
                <th className="py-2">Course</th>
                <th>Lecturer</th>
                <th>Hall</th>
                <th>Date</th>
                <th>Time</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((b) => (
                <tr key={b.id} className="border-b hover:bg-gray-50">
                  <td className="py-2">{b.courseNumber} — {b.courseName}</td>
                  <td>{b.lecturerName}</td>
                  <td>{b.hall}</td>
                  <td>{b.date}</td>
                  <td>{b.startTime} - {b.endTime}</td>
                  <td>
                    {sameName(b.lecturerName, userData.name) && (
                      <>
                        <button
                          onClick={() => handleEdit(b)}
                          className="text-green-700 mr-3 hover:underline"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleCancel(b.id, b.lecturerName)}
                          className="text-red-600 hover:underline"
                        >
                          Delete
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}
