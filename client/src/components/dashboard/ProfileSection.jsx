import React, { useState, useEffect, useMemo } from "react";

// API Base URL (ensure it's configured correctly in your environment)
const API_BASE = "http://localhost:5000"; 

// A small, simple base64 placeholder image (a 1x1 gray dot)
// Use a tool like https://base64.guru/converter/encode/image/png to generate your own.
const DEFAULT_BASE64_IMAGE = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYGD4DwAEgAADR8mXgAAAAABJRU5ErkJggg==";

/** Merge helper: prefer API profile for name/email; keep user edits for others */
function mergeProfile({ apiProfile }) {
  const defaults = {
    name: "",
    title: "",
    department: "",
    qualification: "",
    email: "",
    phone: "",
    office: "",
    research: "",
    // Use the default base64 image if none is provided
    profileImage: DEFAULT_BASE64_IMAGE, 
  };

  const a = apiProfile || {};

  return {
    ...defaults,
    name: a.name || defaults.name,
    email: a.email || defaults.email,
    department: a.department || defaults.department,
    title: a.title || defaults.title,
    qualification: a.qualification || defaults.qualification,
    phone: a.phone || defaults.phone,
    office: a.office || defaults.office,
    research: a.research || defaults.research,
    // Ensure the fetched image is used, falling back to the default
    profileImage: a.profileImage || defaults.profileImage, 
  };
}

/** -------------------- Modal -------------------- */
function Modal({ open, title, onClose, children, footer }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (!open) return;
    setMounted(true);
    const onKey = (e) => {
      if (e.key === "Escape") onClose?.();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
      setMounted(false);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 
        transition-opacity duration-300 ${mounted ? "opacity-100" : "opacity-0"}`}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose?.();
      }}
      style={{
        backdropFilter: "blur(8px)",
      }}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60" />

      {/* Modal Panel */}
      <div
        className={`relative w-full max-w-2xl rounded-3xl bg-white shadow-xl ring-2 ring-emerald-400/40 
          transition-all duration-500 transform ${mounted ? "scale-100 opacity-100" : "scale-95 opacity-0"}`}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between gap-4 
                        rounded-t-3xl bg-emerald-600 text-white px-6 py-4">
          <h3 className="text-lg font-semibold">{title}</h3>
          <button
            onClick={onClose}
            className="inline-flex items-center justify-center h-9 w-9 rounded-full 
                       text-white bg-emerald-700 hover:bg-emerald-800 transition"
            aria-label="Close"
            title="Close"
          >
            ✕
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 max-h-[70vh] overflow-y-auto">
          {children}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 flex items-center justify-end gap-4 p-4 bg-white border-t">
          {footer}
        </div>
      </div>
    </div>
  );
}

function ProfileSection() {
  const [lecturer, setLecturer] = useState(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Load profile from API
  useEffect(() => {
    async function load() {
      setError("");
      const token = localStorage.getItem("token");

      let apiProfile = null;
      if (token) {
        try {
          const res = await fetch(`${API_BASE}/api/staff/me`, {
            headers: { Authorization: token },
          });
          if (res.ok) apiProfile = await res.json();
        } catch (err) {
          setError("Error fetching profile");
        }
      }

      const merged = mergeProfile({ apiProfile });
      setLecturer(merged);
    }

    load();
  }, []);

  // Keep form synced with lecturer data when editing
  useEffect(() => {
    if (editing && lecturer) setForm(lecturer);
  }, [editing, lecturer]);

  const canSave = useMemo(() => {
    if (!form) return false;
    // Check required fields (name, email, title must be present)
    return Boolean(form.name && form.email && form.title);
  }, [form]);

  // Handle profile save (FIXED LOGIC)
  const handleSave = async () => {
    if (!form) return;
    setSaving(true);
    setError("");

    const token = localStorage.getItem("token");

    if (!token) {
        setError("Authentication token missing. Please log in again.");
        setSaving(false);
        return;
    }

    try {
        const res = await fetch(`${API_BASE}/api/staff/me`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: token,
          },
          body: JSON.stringify(form),
        });

        if (!res.ok) {
          let errorMessage = `Server error: Status ${res.status}`;
          try {
            const errorData = await res.json();
            if (errorData.error) {
              errorMessage = errorData.error;
            } else if (errorData.message) {
              errorMessage = errorData.message;
            }
          } catch (e) {
            console.error("Failed to parse error response:", e);
          }
          
          throw new Error(errorMessage);
        }

        setLecturer(prevLecturer => ({
            ...prevLecturer, 
            ...form
        }));
        
        setEditing(false); 
        
    } catch (err) {
        console.error("Profile save failed:", err.message);
        setError(`Failed to save profile: ${err.message}`);
        
    } finally {
        setSaving(false);
    }
  };

  if (!lecturer) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] bg-white">
        <p className="text-gray-500 text-lg">Loading profile...</p>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-10 bg-white">
      {/* Header Card */}
      <div className="relative overflow-hidden rounded-2xl border bg-gradient-to-br from-white to-gray-50">
        <div className="absolute -right-12 -top-12 h-40 w-40 rounded-full bg-green-100" />
        <div className="absolute -left-10 -bottom-10 h-32 w-32 rounded-full bg-emerald-100" />

        <div className="relative flex flex-col md:flex-row items-center gap-6 md:gap-8 p-6 md:p-8">
          <img
            // The src attribute accepts the base64 data URI
            src={lecturer.profileImage} 
            alt="Lecturer"
            className="w-28 h-28 md:w-32 md:h-32 rounded-full object-cover border-4 border-white shadow-lg ring-2 ring-emerald-300/60"
          />
          <div className="text-center md:text-left">
            <h1 className="text-2xl md:text-3xl font-semibold text-gray-900 tracking-tight">
              {lecturer.name}
            </h1>
            <p className="mt-1 text-emerald-700 font-medium">{lecturer.title}</p>
            <p className="text-gray-600">{lecturer.department}</p>

            <div className="mt-4 flex flex-wrap items-center justify-center md:justify-start gap-3">
              <button
                onClick={() => setEditing(true)}
                className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-white shadow-md transition hover:bg-emerald-700 active:scale-[0.99]"
              >
                <span>✎</span> Edit Profile
              </button>
             
            </div>
          </div>
        </div>
      </div>

      {/* Info Cards */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="rounded-2xl border bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-emerald-700 mb-3">
            Contact Information
          </h2>
          <div className="space-y-2 text-gray-700">
            <p>
              <span className="font-medium">Email:</span> {lecturer.email}
            </p>
            <p>
              <span className="font-medium">Phone:</span> {lecturer.phone}
            </p>
            <p>
              <span className="font-medium">Office:</span> {lecturer.office}
            </p>
          </div>
        </div>

        <div className="rounded-2xl border bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-emerald-700 mb-3">
            Academic Profile
          </h2>
          <div className="space-y-2 text-gray-700">
            <p>
              <span className="font-medium">Qualification:</span>{" "}
              {lecturer.qualification}
            </p>
            <p>
              <span className="font-medium">Research Area:</span>{" "}
              {lecturer.research}
            </p>
          </div>
        </div>
      </div>

      {/* EDIT MODAL */}
      <Modal
        open={editing}
        title="Edit Lecturer Profile"
        onClose={() => setEditing(false)}
        footer={
          <>
            <button
              onClick={() => setEditing(false)}
              className="px-4 py-2 rounded-lg border hover:bg-gray-50"
              disabled={saving}
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={!form || !canSave || saving}
              className={`px-5 py-2 rounded-lg text-white ${
                !form || !canSave || saving
                  ? "bg-emerald-400 cursor-not-allowed"
                  : "bg-emerald-600 hover:bg-emerald-700"
              }`}
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </>
        }
      >
        {error && (
          <div className="mb-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg p-3">
            {error}
          </div>
        )}

        {form && (
          <>
            {/* Form Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <label className="block">
                <span className="text-sm text-gray-700">Full Name</span>
                <input
                  type="text"
                  className="mt-2 w-full px-4 py-2 rounded-lg border-2 border-gray-300 focus:border-emerald-500 focus:ring-emerald-500 transition"
                  value={form.name}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, name: e.target.value }))
                  }
                />
              </label>

              <label className="block">
                <span className="text-sm text-gray-700">Title/Role</span>
                <input
                  type="text"
                  className="mt-2 w-full px-4 py-2 rounded-lg border-2 border-gray-300 focus:border-emerald-500 focus:ring-emerald-500 transition"
                  value={form.title}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, title: e.target.value }))
                  }
                />
              </label>

              <label className="block">
                <span className="text-sm text-gray-700">Department</span>
                <input
                  type="text"
                  className="mt-2 w-full px-4 py-2 rounded-lg border-2 border-gray-300 focus:border-emerald-500 focus:ring-emerald-500 transition"
                  value={form.department}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, department: e.target.value }))
                  }
                />
              </label>

              <label className="block">
                <span className="text-sm text-gray-700">Qualification</span>
                <input
                  type="text"
                  className="mt-2 w-full px-4 py-2 rounded-lg border-2 border-gray-300 focus:border-emerald-500 focus:ring-emerald-500 transition"
                  value={form.qualification}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, qualification: e.target.value }))
                  }
                />
              </label>

              <label className="block">
                <span className="text-sm text-gray-700">Email</span>
                <input
                  type="email"
                  className="mt-2 w-full px-4 py-2 rounded-lg border-2 border-gray-300 focus:border-emerald-500 focus:ring-emerald-500 transition"
                  value={form.email}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, email: e.target.value }))
                  }
                />
              </label>

              <label className="block">
                <span className="text-sm text-gray-700">Phone</span>
                <input
                  type="text"
                  className="mt-2 w-full px-4 py-2 rounded-lg border-2 border-gray-300 focus:border-emerald-500 focus:ring-emerald-500 transition"
                  value={form.phone}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, phone: e.target.value }))
                  }
                />
              </label>
              
              {/* --- UPDATED INPUT FIELD FOR BASE64 IMAGE DATA --- */}
              <label className="block md:col-span-2">
                <span className="text-sm text-gray-700">Profile Image (Base64 Data URI)</span>
                <textarea
                  rows={4}
                  className="mt-2 w-full px-4 py-2 rounded-lg border-2 border-gray-300 focus:border-emerald-500 focus:ring-emerald-500 transition font-mono text-xs"
                  value={form.profileImage}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, profileImage: e.target.value }))
                  }
                  placeholder="Paste the 'data:image/...' base64 string here. The default is a tiny gray square."
                />
              </label>
              {/* -------------------------------------------------- */}


              <label className="block md:col-span-2">
                <span className="text-sm text-gray-700">Office</span>
                <input
                  type="text"
                  className="mt-2 w-full px-4 py-2 rounded-lg border-2 border-gray-300 focus:border-emerald-500 focus:ring-emerald-500 transition"
                  value={form.office}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, office: e.target.value }))
                  }
                />
              </label>

              <label className="block md:col-span-2">
                <span className="text-sm text-gray-700">Research Areas</span>
                <textarea
                  rows={3}
                  className="mt-2 w-full px-4 py-2 rounded-lg border-2 border-gray-300 focus:border-emerald-500 focus:ring-emerald-500 transition"
                  value={form.research}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, research: e.target.value }))
                  }
                  placeholder="e.g., IoT systems, embedded computing, AI automation…"
                />
              </label>
            </div>
          </>
        )}
      </Modal>
    </div>
  );
}

export default ProfileSection;