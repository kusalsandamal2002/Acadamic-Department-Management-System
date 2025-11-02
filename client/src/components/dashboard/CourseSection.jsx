// src/components/CourseSection.jsx
import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

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
  const [loadingCourses, setLoadingCourses] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // ---------- Load current user: server first, then (optional) cache ----------
  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) {
      localStorage.removeItem("userData");
      navigate("/login");
      return;
    }

    axios
      .get("http://localhost:5000/api/auth/profile", {
        headers: { Authorization: token }, // your verifyToken expects raw token
      })
      .then((res) => {
        const data = {
          name: res?.data?.name || "Lecturer",
          role: res?.data?.role || "Lecturer",
        };
        setUserData(data);
        localStorage.setItem("userData", JSON.stringify(data));
      })
      .catch(() => {
        // fallback to local cache if exists; else force login
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

  // Keep lecturerName in form synced with user
  useEffect(() => {
    setFormData((p) => ({ ...p, lecturerName: userData.name || "" }));
  }, [userData?.name]);

  // ---------- Load courses from backend ----------
  const fetchCourses = () => {
    setLoadingCourses(true);
    setError("");
    axios
      .get("http://localhost:5000/api/courses", {
        headers: { Authorization: localStorage.getItem("token") },
      })
      .then((res) => setCourses(Array.isArray(res.data) ? res.data : []))
      .catch((err) => {
        console.error("Failed to load courses:", err?.response?.data || err.message);
        setError("Cannot load courses from server.");
      })
      .finally(() => setLoadingCourses(false));
  };

  useEffect(() => {
    fetchCourses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

    // Optional: prevent duplicate courseNumber on the client for better UX
    const duplicate = courses.some(
      (c) =>
        String(c.courseNumber).trim().toLowerCase() ===
          courseNumber.trim().toLowerCase() && (!editingId || c.id !== editingId)
    );
    if (duplicate) {
      setError("This course number already exists.");
      return;
    }

    setSubmitting(true);

    if (editingId) {
      // Ownership guard (also should be enforced on backend if you want stronger security)
      const target = courses.find((c) => c.id === editingId);
      if (target && !sameName(target.lecturerName, userData.name)) {
        setSubmitting(false);
        setError("Only the course owner can update this course.");
        return;
      }

      axios
        .put(`http://localhost:5000/api/courses/${editingId}`, formData, {
          headers: { Authorization: localStorage.getItem("token") },
        })
        .then((res) => {
          const updated = res.data; // { id, courseNumber, courseName, lecturerName }
          setCourses((prev) =>
            prev.map((c) => (c.id === editingId ? updated : c))
          );
          setSuccess("✅ Course updated successfully.");
          resetForm();
        })
        .catch((err) => {
          setError(err.response?.data?.error || "Update failed.");
        })
        .finally(() => setSubmitting(false));
    } else {
      axios
        .post("http://localhost:5000/api/courses", formData, {
          headers: { Authorization: localStorage.getItem("token") },
        })
        .then((res) => {
          const created = res.data; // { id, courseNumber, courseName, lecturerName }
          setCourses((prev) => [created, ...prev]);
          setSuccess("✅ Course added successfully.");
          resetForm();
        })
        .catch((err) => setError(err.response?.data?.error || "Add failed."))
        .finally(() => setSubmitting(false));
    }
  };

  const handleEdit = (c) => {
    if (!sameName(c.lecturerName, userData.name)) return;
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
    setSubmitting(true);
    axios
      .delete(`http://localhost:5000/api/courses/${id}`, {
        headers: { Authorization: localStorage.getItem("token") },
      })
      .then(() => {
        setCourses((prev) => prev.filter((c) => c.id !== id));
        setSuccess("🗑️ Course deleted successfully.");
        if (editingId === id) resetForm();
      })
      .catch((err) => setError(err.response?.data?.error || "Delete failed."))
      .finally(() => setSubmitting(false));
  };

  const sortedCourses = useMemo(
    () => [...courses].sort((a, b) => String(a.courseNumber).localeCompare(String(b.courseNumber))),
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
            disabled={loadingUser || submitting}
            className="bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white font-semibold py-2 px-6 rounded-md transition"
          >
            {submitting
              ? (editingId ? "Updating…" : "Adding…")
              : (editingId ? "Update Course" : "Add Course")}
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
          <button
            type="button"
            onClick={fetchCourses}
            disabled={loadingCourses}
            className="border border-green-600 text-green-700 hover:bg-green-50 font-semibold py-2 px-4 rounded-md transition"
            title="Reload list from server"
          >
            {loadingCourses ? "Refreshing…" : "Refresh"}
          </button>
        </div>
      </form>

      {/* Course Table */}
      <section className="max-w-5xl mx-auto mt-10">
        <h3 className="text-2xl font-bold text-gray-800 mb-4">Courses List</h3>
        {loadingCourses && courses.length === 0 ? (
          <p className="text-gray-600">Loading courses…</p>
        ) : sortedCourses.length === 0 ? (
          <p className="text-gray-600">No courses found.</p>
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
                            onClick={() => owner && handleDelete(c.id)}
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
