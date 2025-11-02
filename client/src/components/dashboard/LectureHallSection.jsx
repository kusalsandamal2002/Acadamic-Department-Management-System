import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

/** ---------- Storage Keys ---------- */
const STORAGE = {
  ACTIVE_BOOKINGS: "uoc_bookings_active",
  COURSES: "uoc_courses",
};

/** ---------- Time helpers ---------- */
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

/** ---------- Utils ---------- */
const sameName = (a = "", b = "") =>
  String(a).trim().toLowerCase() === String(b).trim().toLowerCase();

const readCourses = () => {
  try {
    const raw = localStorage.getItem(STORAGE.COURSES);
    const list = JSON.parse(raw || "[]");
    // Expect shape from CourseSection: {id, courseNumber, courseName, lecturerName, createdAt}
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
};

export default function LectureHallSection() {
  const navigate = useNavigate();

  /** ---------- auth / current user ---------- */
  const [userData, setUserData] = useState({ name: "", role: "" });
  const [loadingUser, setLoadingUser] = useState(true);

  /** ---------- courses ---------- */
  const [courses, setCourses] = useState([]); // [{id, courseNumber, courseName, lecturerName}]
  const sortedCourses = useMemo(
    () =>
      [...courses].sort((a, b) =>
        a.courseNumber.localeCompare(b.courseNumber)
      ),
    [courses]
  );

  /** ---------- form state ---------- */
  const [formData, setFormData] = useState({
    selectedCourseId: "",        // link to course list
    courseNumber: "",            // auto from selected course (read-only)
    courseName: "",              // auto from selected course (read-only)
    lecturerName: "",            // auto from profile
    hall: "",
    date: "",
    startTime: "",
    endTime: "",
  });
  const [editingId, setEditingId] = useState(null);

  /** ---------- bookings ---------- */
  const [bookings, setBookings] = useState([]);

  /** ---------- ui ---------- */
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  /** ---------- load user (server first, then cache) ---------- */
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      localStorage.removeItem("userData");
      navigate("/login");
      return;
    }

    axios
      .get("http://localhost:5000/api/auth/profile", {
        headers: { Authorization: token }, // use `Bearer ${token}` if your backend expects it
      })
      .then((res) => {
        const data = {
          name: res?.data?.name || "Lecturer",
          role: res?.data?.role || "Lecturer",
        };
        setUserData(data);
        localStorage.setItem("userData", JSON.stringify(data));
      })
      .catch((err) => {
        console.error("Profile fetch failed:", err?.response?.data || err.message);
        const cached = localStorage.getItem("userData");
        if (cached) {
          try {
            const parsed = JSON.parse(cached);
            setUserData({
              name: parsed?.name || "Lecturer",
              role: parsed?.role || "Lecturer",
            });
          } catch {
            localStorage.removeItem("token");
            localStorage.removeItem("userData");
            navigate("/login");
          }
        } else {
          localStorage.removeItem("token");
          localStorage.removeItem("userData");
          navigate("/login");
        }
      })
      .finally(() => setLoadingUser(false));
  }, [navigate]);

  // keep lecturerName synced
  useEffect(() => {
    setFormData((p) => ({ ...p, lecturerName: userData.name || "" }));
  }, [userData?.name]);

  /** ---------- load/persist bookings ---------- */
  useEffect(() => {
    try {
      const a = JSON.parse(localStorage.getItem(STORAGE.ACTIVE_BOOKINGS) || "[]");
      setBookings(a);
    } catch {}
  }, []);
  useEffect(() => {
    localStorage.setItem(STORAGE.ACTIVE_BOOKINGS, JSON.stringify(bookings));
  }, [bookings]);

  /** ---------- load courses + live update from CourseSection ---------- */
  useEffect(() => {
    setCourses(readCourses());

    // live sync when CourseSection writes to localStorage
    const onStorage = (e) => {
      if (e.key === STORAGE.COURSES) {
        setCourses(readCourses());
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  /** ---------- permissions ---------- */
  const isOwner = (name) => sameName(name, userData.name);
  const canEdit = (b) => isOwner(b.lecturerName);
  const canCancel = (b) => isOwner(b.lecturerName);

  /** ---------- handlers ---------- */
  const handleChange = (e) => {
    setError("");
    setSuccess("");
    const { name, value } = e.target;

    // When user picks a course, auto-fill number+name
    if (name === "selectedCourseId") {
      const selected = courses.find((c) => String(c.id) === String(value));
      setFormData((p) => ({
        ...p,
        selectedCourseId: value,
        courseNumber: selected?.courseNumber || "",
        courseName: selected?.courseName || "",
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

    if (!courseNumber || !courseName || !lecturerName || !hall || !date || !startTime || !endTime) {
      return "Please complete all fields (select a course, set hall, date and time).";
    }
    if (timeToMinutes(endTime) <= timeToMinutes(startTime)) {
      return "End time must be after start time.";
    }
    const conflict = bookings.some((b) => {
      if (editingId && b.id === editingId) return false;
      return (
        b.hall === hall &&
        b.date === date &&
        overlaps(b.startTime, b.endTime, startTime, endTime)
      );
    });
    if (conflict) return `Time conflict: ${hall} is already booked in this time range.`;
    return "";
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (loadingUser) {
      setError("Please wait, loading your profile…");
      return;
    }
    if (!userData.name) {
      setError("Could not detect your lecturer name. Please login again.");
      return;
    }

    const v = validate();
    if (v) {
      setError(v);
      return;
    }

    if (editingId) {
      const target = bookings.find((b) => b.id === editingId);
      if (target && !canEdit(target)) {
        setError("Only the booking owner can update this booking.");
        return;
      }
      setBookings((prev) =>
        prev.map((b) => (b.id === editingId ? { ...b, ...formData } : b))
      );
      setSuccess("✅ Booking updated successfully.");
    } else {
      const newBooking = {
        id: Date.now(),
        createdAt: new Date().toISOString(),
        ...formData, // includes courseNumber, courseName, lecturerName
      };
      setBookings((prev) => [newBooking, ...prev]);
      setSuccess("✅ Lecture hall booked successfully.");
    }
    resetForm();
  };

  const handleEdit = (b) => {
    if (!canEdit(b)) return;

    // try to match the selected course by number+name (robust if ids changed)
    const match = courses.find(
      (c) =>
        sameName(c.courseNumber, b.courseNumber) &&
        sameName(c.courseName, b.courseName)
    );

    setFormData({
      selectedCourseId: match ? String(match.id) : "",
      courseNumber: b.courseNumber,
      courseName: b.courseName,
      lecturerName: b.lecturerName || userData.name || "",
      hall: b.hall,
      date: b.date,
      startTime: b.startTime,
      endTime: b.endTime,
    });
    setEditingId(b.id);
    setSuccess("");
    setError("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleCancel = (b) => {
    if (!canCancel(b)) {
      setError("Only the booking owner can cancel this booking.");
      return;
    }
    setBookings((prev) => prev.filter((x) => x.id !== b.id));
    if (editingId === b.id) resetForm();
    setSuccess("🗑️ Booking cancelled.");
  };

  /** ---------- derived ---------- */
  const upcomingSorted = useMemo(() => {
    return [...bookings].sort((a, b) => {
      if (a.date === b.date) {
        return timeToMinutes(a.startTime) - timeToMinutes(b.startTime);
      }
      return a.date.localeCompare(b.date);
    });
  }, [bookings]);

  /** ---------- UI ---------- */
  return (
    <div className="w-full px-6 py-8">
      {/* Header */}
      <h2 className="text-3xl font-bold text-green-700 mb-2 text-center">
        Lecture Hall Booking
      </h2>
      <p className="text-center text-sm text-gray-600 mb-6">
        Logged in as{" "}
        <span className="font-semibold text-green-700">
          {loadingUser ? "Loading…" : userData.name || "—"}
        </span>
      </p>

      {/* Alerts */}
      {error && (
        <div className="bg-red-100 text-red-700 p-3 rounded-md mb-4 text-center">
          {error}
        </div>
      )}
      {success && (
        <div className="bg-green-100 text-green-700 p-3 rounded-md mb-4 text-center">
          {success}
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-5 max-w-5xl mx-auto text-gray-800">
        {/* Course picker */}
        <div>
          <label className="block font-semibold mb-1">Course</label>
          <select
            name="selectedCourseId"
            value={formData.selectedCourseId}
            onChange={handleChange}
            required
            className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-green-500 focus:outline-none"
          >
            <option value="">
              {sortedCourses.length ? "-- Select Course --" : "No courses found (add in Course Management)"}
            </option>
            {sortedCourses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.courseNumber} — {c.courseName}
              </option>
            ))}
          </select>
          <p className="text-xs text-gray-500 mt-1">
            Add courses in <span className="font-medium">Course Management</span>; they will appear here automatically.
          </p>
        </div>

        {/* Read-only course details */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div>
            <label className="block font-semibold mb-1">Course Number</label>
            <input
              type="text"
              name="courseNumber"
              value={formData.courseNumber}
              readOnly
              className="w-full bg-gray-100 border border-gray-300 rounded-md p-2 focus:outline-none"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block font-semibold mb-1">Course Name</label>
            <input
              type="text"
              name="courseName"
              value={formData.courseName}
              readOnly
              className="w-full bg-gray-100 border border-gray-300 rounded-md p-2 focus:outline-none"
            />
          </div>
        </div>

        {/* Lecturer (read-only, auto from server/cache) */}
        <div>
          <label className="block font-semibold mb-1">Lecturer Name</label>
          <input
            type="text"
            name="lecturerName"
            value={formData.lecturerName}
            readOnly
            className="w-full bg-gray-100 border border-gray-300 rounded-md p-2 focus:outline-none"
            title="Auto-filled from your authenticated profile"
          />
          <p className="text-sm text-gray-500 mt-1">
            Auto-filled from your authenticated profile.
          </p>
        </div>

        {/* Hall */}
        <div>
          <label className="block font-semibold mb-1">Select Lecture Hall</label>
          <select
            name="hall"
            value={formData.hall}
            onChange={handleChange}
            required
            className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-green-500 focus:outline-none"
          >
            <option value="">-- Select Hall --</option>
            <option value="A101">A101 - Main Building</option>
            <option value="B202">B202 - Science Block</option>
            <option value="C303">C303 - Engineering Block</option>
            <option value="D404">D404 - ICT Auditorium</option>
          </select>
        </div>

        {/* Date & Time */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div>
            <label className="block font-semibold mb-1">Date</label>
            <input
              type="date"
              name="date"
              value={formData.date}
              onChange={handleChange}
              required
              className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-green-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block font-semibold mb-1">Start Time</label>
            <input
              type="time"
              name="startTime"
              value={formData.startTime}
              onChange={handleChange}
              required
              className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-green-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block font-semibold mb-1">End Time</label>
            <input
              type="time"
              name="endTime"
              value={formData.endTime}
              onChange={handleChange}
              required
              className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-green-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={loadingUser || !formData.courseNumber}
            className="bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white font-semibold py-2 px-6 rounded-md transition"
          >
            {editingId ? "Update Booking" : "Book Lecture Hall"}
          </button>
          {editingId && (
            <button
              type="button"
              onClick={resetForm}
              className="border border-gray-300 hover:bg-gray-50 text-gray-700 font-semibold py-2 px-4 rounded-md transition"
            >
              Cancel Edit
            </button>
          )}
        </div>
      </form>

      {/* Active Bookings */}
      <section className="max-w-6xl mx-auto mt-10">
        <h3 className="text-2xl font-bold text-gray-800 mb-4">Active Bookings</h3>
        {upcomingSorted.length === 0 ? (
          <p className="text-gray-600">No active bookings yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b">
                  <th className="py-3 pr-3">Course No</th>
                  <th className="py-3 pr-3">Course Name</th>
                  <th className="py-3 pr-3">Lecturer</th>
                  <th className="py-3 pr-3">Hall</th>
                  <th className="py-3 pr-3">Date</th>
                  <th className="py-3 pr-3">Start</th>
                  <th className="py-3 pr-3">End</th>
                  <th className="py-3 pr-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {upcomingSorted.map((b) => {
                  const owner = canEdit(b);
                  return (
                    <tr key={b.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 pr-3 font-medium">{b.courseNumber}</td>
                      <td className="py-3 pr-3">{b.courseName}</td>
                      <td className="py-3 pr-3">{b.lecturerName}</td>
                      <td className="py-3 pr-3">{b.hall}</td>
                      <td className="py-3 pr-3">{b.date}</td>
                      <td className="py-3 pr-3">{b.startTime}</td>
                      <td className="py-3 pr-3">{b.endTime}</td>
                      <td className="py-3 pr-3">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => owner && handleEdit(b)}
                            className={
                              owner
                                ? "text-green-700 hover:underline"
                                : "text-gray-400 cursor-not-allowed"
                            }
                            title={owner ? "Edit booking" : "Only the owner can edit"}
                            disabled={!owner}
                          >
                            Edit
                          </button>
                          <span className="text-gray-300">|</span>
                          <button
                            onClick={() => handleCancel(b)}
                            className={
                              canCancel(b)
                                ? "text-red-600 hover:underline"
                                : "text-gray-400 cursor-not-allowed"
                            }
                            title={canCancel(b) ? "Cancel booking" : "Only the owner can cancel"}
                            disabled={!canCancel(b)}
                          >
                            Cancel
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
