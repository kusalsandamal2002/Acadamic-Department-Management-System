import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const STORAGE_KEY = "uoc_courses";

/** Compare names case-insensitively */
const sameName = (a = "", b = "") =>
  String(a).trim().toLowerCase() === String(b).trim().toLowerCase();

export default function CourseSection() {
  const navigate = useNavigate();

  // ---- auth / user ----
  const [userData, setUserData] = useState({ name: "", role: "" });
  const [loadingUser, setLoadingUser] = useState(true);

  // ---- courses ----
  const [courses, setCourses] = useState([]);
  const [formData, setFormData] = useState({
    courseNumber: "",
    courseName: "",
    lecturerName: "", // auto from user
  });
  const [editingId, setEditingId] = useState(null);

  // ---- ui ----
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  // ---------- Load current user: server first, then cache ----------
  useEffect(() => {
    const token = localStorage.getItem("token");

    // If no token at all -> logout
    if (!token) {
      localStorage.removeItem("userData");
      navigate("/login");
      return;
    }

    axios
      .get("http://localhost:5000/api/auth/profile", {
        headers: { Authorization: token }, // raw token (middleware expects this)
      })
      .then((res) => {
        const data = {
          name: res?.data?.name || "Lecturer",
          role: res?.data?.role || "Lecturer",
        };
        setUserData(data);
        localStorage.setItem("userData", JSON.stringify(data)); // cache
      })
      .catch((err) => {
        console.error("Profile fetch failed:", err?.response?.data || err.message);
        // fallback to local cache if exists
        const cached = localStorage.getItem("userData");
        if (cached) {
          try {
            const parsed = JSON.parse(cached);
            const data = {
              name: parsed?.name || "Lecturer",
              role: parsed?.role || "Lecturer",
            };
            setUserData(data);
          } catch {
            // invalid cache -> logout
            localStorage.removeItem("token");
            localStorage.removeItem("userData");
            navigate("/login");
          }
        } else {
          // invalid token & no cache -> logout
          localStorage.removeItem("token");
          localStorage.removeItem("userData");
          navigate("/login");
        }
      })
      .finally(() => setLoadingUser(false));
  }, [navigate]);

  // Keep lecturerName in form synced with user
  useEffect(() => {
    setFormData((p) => ({ ...p, lecturerName: userData.name || "" }));
  }, [userData?.name]);

  // ---------- Load / save courses ----------
  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
      setCourses(stored);
    } catch {}
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(courses));
  }, [courses]);

  // ---------- Handlers ----------
  const handleChange = (e) => {
    setError("");
    setSuccess("");
    const { name, value } = e.target;
    setFormData((p) => ({ ...p, [name]: value }));
  };

  const resetForm = () => {
    setFormData({
      courseNumber: "",
      courseName: "",
      lecturerName: userData.name || "",
    });
    setEditingId(null);
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

    const { courseNumber, courseName } = formData;
    if (!courseNumber || !courseName) {
      setError("Please enter both course number and course name.");
      return;
    }

    // Duplicate course number prevention
    const duplicate = courses.some(
      (c) =>
        c.courseNumber.trim().toLowerCase() === courseNumber.trim().toLowerCase() &&
        (!editingId || c.id !== editingId)
    );
    if (duplicate) {
      setError("This course number already exists.");
      return;
    }

    if (editingId) {
      const target = courses.find((c) => c.id === editingId);
      if (target && !sameName(target.lecturerName, userData.name)) {
        setError("Only the course owner can update this course.");
        return;
      }
      setCourses((prev) =>
        prev.map((c) =>
          c.id === editingId
            ? { ...c, courseNumber: courseNumber.trim(), courseName: courseName.trim() }
            : c
        )
      );
      setSuccess("✅ Course updated successfully.");
    } else {
      const newCourse = {
        id: Date.now(),
        courseNumber: courseNumber.trim(),
        courseName: courseName.trim(),
        lecturerName: userData.name, // stamp owner
        createdAt: new Date().toISOString(),
      };
      setCourses((prev) => [newCourse, ...prev]);
      setSuccess("✅ Course added successfully.");
    }

    resetForm();
  };

  const handleEdit = (c) => {
    if (!sameName(c.lecturerName, userData.name)) return; // guard
    setFormData({
      courseNumber: c.courseNumber,
      courseName: c.courseName,
      lecturerName: userData.name || "",
    });
    setEditingId(c.id);
    setSuccess("");
    setError("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = (id) => {
    const target = courses.find((c) => c.id === id);
    if (target && !sameName(target.lecturerName, userData.name)) {
      setError("Only the course owner can delete this course.");
      return;
    }
    setCourses((prev) => prev.filter((c) => c.id !== id));
    setSuccess("🗑️ Course deleted successfully.");
    if (editingId === id) resetForm();
  };

  const sortedCourses = useMemo(
    () => [...courses].sort((a, b) => a.courseNumber.localeCompare(b.courseNumber)),
    [courses]
  );

  // ---------- UI ----------
  return (
    <div className="w-full px-6 py-8">
      <h2 className="text-3xl font-bold text-green-700 mb-2 text-center">
        Course Management
      </h2>
      <p className="text-center text-sm text-gray-600 mb-6">
        Logged in as{" "}
        <span className="font-semibold text-green-700">
          {loadingUser ? "Loading…" : userData.name || "—"}
        </span>
      </p>

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
      <form
        onSubmit={handleSubmit}
        className="space-y-5 max-w-3xl mx-auto text-gray-800"
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div>
            <label className="block font-semibold mb-1">Course Number</label>
            <input
              type="text"
              name="courseNumber"
              value={formData.courseNumber}
              onChange={handleChange}
              placeholder="e.g., ET3012"
              required
              className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-green-500 focus:outline-none"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block font-semibold mb-1">Course Name</label>
            <input
              type="text"
              name="courseName"
              value={formData.courseName}
              onChange={handleChange}
              placeholder="e.g., Signals and Systems"
              required
              className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-green-500 focus:outline-none"
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

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={loadingUser}
            className="bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white font-semibold py-2 px-6 rounded-md transition"
          >
            {editingId ? "Update Course" : "Add Course"}
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

      {/* Course Table */}
      <section className="max-w-5xl mx-auto mt-10">
        <h3 className="text-2xl font-bold text-gray-800 mb-4">Courses List</h3>
        {sortedCourses.length === 0 ? (
          <p className="text-gray-600">No courses added yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b">
                  <th className="py-3 pr-3">Course Number</th>
                  <th className="py-3 pr-3">Course Name</th>
                  <th className="py-3 pr-3">Lecturer</th>
                  <th className="py-3 pr-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {sortedCourses.map((c) => {
                  const owner = sameName(c.lecturerName, userData.name);
                  return (
                    <tr key={c.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 pr-3 font-medium">{c.courseNumber}</td>
                      <td className="py-3 pr-3">{c.courseName}</td>
                      <td className="py-3 pr-3">{c.lecturerName}</td>
                      <td className="py-3 pr-3">
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => owner && handleEdit(c)}
                            className={
                              owner
                                ? "text-green-700 hover:underline"
                                : "text-gray-400 cursor-not-allowed"
                            }
                            title={owner ? "Edit course" : "Only the owner can edit"}
                            disabled={!owner}
                          >
                            Edit
                          </button>
                          <span className="text-gray-300">|</span>
                          <button
                            onClick={() => handleDelete(c.id)}
                            className={
                              owner
                                ? "text-red-600 hover:underline"
                                : "text-gray-400 cursor-not-allowed"
                            }
                            title={owner ? "Delete course" : "Only the owner can delete"}
                            disabled={!owner}
                          >
                            Delete
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
