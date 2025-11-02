import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { FaPlus, FaEdit, FaTrash, FaCalendarAlt, FaTimes } from "react-icons/fa";

const API_BASE = "http://localhost:5000/api";

function combineDateTime(d, t) {
  // "2025-11-02" + "14:30" -> ISO
  return new Date(`${d}T${t}:00`);
}

function emptyForm() {
  return {
    id: null,
    title: "",
    date: "",
    time: "",
    location: "",
    description: "",
  };
}

export default function EventsPage() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [query, setQuery] = useState("");
  const [form, setForm] = useState(emptyForm());
  const [showModal, setShowModal] = useState(false);

  const token = localStorage.getItem("token");

  // ---- Load events (API → fallback localStorage) ----
  useEffect(() => {
    const fetchEvents = async () => {
      setLoading(true);
      if (!token) {
        console.error("No token available.");
        setLoading(false);
        return;
      }

      try {
        const { data } = await axios.get(`${API_BASE}/events`, {
          headers: { Authorization: token },
        });
        setEvents(Array.isArray(data) ? data : []);
        localStorage.setItem("eventsCache", JSON.stringify(data || []));
      } catch (e) {
        console.warn("Events API unavailable, using local cache.", e?.message);
        const cached = localStorage.getItem("eventsCache");
        setEvents(cached ? JSON.parse(cached) : []);
      } finally {
        setLoading(false);
      }
    };
    fetchEvents();
  }, [token]);

  // ---- Derived / filtered view ----
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = q
      ? events.filter(
          (e) =>
            e.title?.toLowerCase().includes(q) ||
            e.location?.toLowerCase().includes(q) ||
            e.description?.toLowerCase().includes(q)
        )
      : events.slice();

    // sort by date+time ascending
    return list.sort((a, b) => {
      const ad = new Date(a.dateTime || combineDateTime(a.date, a.time));
      const bd = new Date(b.dateTime || combineDateTime(b.date, b.time));
      return ad - bd;
    });
  }, [events, query]);

  // ---- Create / Update ----
  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.title || !form.date || !form.time) return;

    setSaving(true); // Set saving to true when the save process starts

    const payload = {
      title: form.title,
      location: form.location,
      description: form.description,
      date: form.date,
      time: form.time,
      dateTime: combineDateTime(form.date, form.time).toISOString(),
    };

    try {
      let updatedEvents;
      if (form.id) {
        // If updating an existing event
        const { data } = await axios.put(`${API_BASE}/events/${form.id}`, payload, {
          headers: { Authorization: token },
        });
        updatedEvents = data;  // If successful, get updated event data
      } else {
        // If creating a new event
        const { data } = await axios.post(`${API_BASE}/events`, payload, {
          headers: { Authorization: token },
        });
        updatedEvents = data; // New event created successfully
      }

      // Update the events list in the state
      const updatedEventsList = form.id
        ? events.map((ev) => (ev.id === form.id ? updatedEvents : ev))  // Update the event if editing
        : [...events, updatedEvents];  // Add the new event if creating

      setEvents(updatedEventsList);  // Update the events state
      localStorage.setItem("eventsCache", JSON.stringify(updatedEventsList));  // Store the updated events list in localStorage

      setShowModal(false); // Close the modal
      setForm(emptyForm()); // Reset form fields
    } catch (err) {
      console.error("Save failed:", err?.response?.data || err.message);
    } finally {
      setSaving(false); // Set saving to false when save process is finished
    }
  };

  // ---- Delete ----
  const handleDelete = async (id) => {
    if (!window.confirm("Delete this event?")) return;
    try {
      await axios.delete(`${API_BASE}/events/${id}`, {
        headers: { Authorization: token },
      });
      const copy = events.filter((e) => e.id !== id);
      setEvents(copy);
      localStorage.setItem("eventsCache", JSON.stringify(copy));
    } catch (err) {
      console.error("Delete failed:", err?.response?.data || err.message);
    }
  };

  const openCreate = () => {
    setForm(emptyForm());
    setShowModal(true);
  };

  const openEdit = (ev) => {
    setForm({
      id: ev.id ?? null,
      title: ev.title ?? "",
      location: ev.location ?? "",
      description: ev.description ?? "",
      date: ev.date ?? (ev.dateTime ? ev.dateTime.slice(0, 10) : ""),
      time:
        ev.time ??
        (ev.dateTime
          ? new Date(ev.dateTime).toTimeString().slice(0, 5)
          : ""),
    });
    setShowModal(true);
  };

  return (
    <div className="space-y-6">
      {/* Header Row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <FaCalendarAlt className="text-emerald-600 text-2xl" />
          <h2 className="text-xl font-semibold text-gray-800">Event Management</h2>
        </div>
        <button
          onClick={openCreate}
          className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-4 py-2 rounded-lg shadow-sm"
        >
          <FaPlus /> New Event
        </button>
      </div>

      {/* Search */}
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search events by title, location, description…"
          className="flex-1 border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
        />
      </div>

      {/* List */}
      <div className="border border-gray-100 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr className="text-left text-gray-600">
              <th className="px-4 py-3">Title</th>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Time</th>
              <th className="px-4 py-3">Location</th>
              <th className="px-4 py-3">Description</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td className="px-4 py-6 text-gray-500" colSpan={6}>
                  Loading events…
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td className="px-4 py-6 text-gray-500" colSpan={6}>
                  No events found.
                </td>
              </tr>
            ) : (
              filtered.map((ev) => {
                const d = ev.date || (ev.dateTime ? ev.dateTime.slice(0, 10) : "");
                const t =
                  ev.time ||
                  (ev.dateTime ? new Date(ev.dateTime).toTimeString().slice(0, 5) : "");
                return (
                  <tr key={ev.id} className="border-t border-gray-100">
                    <td className="px-4 py-3 font-medium text-gray-800">{ev.title}</td>
                    <td className="px-4 py-3">{d}</td>
                    <td className="px-4 py-3">{t}</td>
                    <td className="px-4 py-3">{ev.location || "-"}</td>
                    {/* Show the Description in the table */}
                    <td className="px-4 py-3">{ev.description || "-"}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openEdit(ev)}
                          className="px-3 py-1.5 rounded-md border border-gray-200 hover:bg-gray-50 inline-flex items-center gap-2"
                        >
                          <FaEdit /> Edit
                        </button>
                        <button
                          onClick={() => handleDelete(ev.id)}
                          className="px-3 py-1.5 rounded-md border border-red-200 text-red-600 hover:bg-red-50 inline-flex items-center gap-2"
                        >
                          <FaTrash /> Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-xl rounded-2xl shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h3 className="text-lg font-semibold text-gray-800">
                {form.id ? "Edit Event" : "Create Event"}
              </h3>
              <button
                className="p-2 rounded-full hover:bg-gray-100"
                onClick={() => setShowModal(false)}
                aria-label="Close"
              >
                <FaTimes />
              </button>
            </div>

            <form onSubmit={handleSave} className="px-6 py-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Title<span className="text-red-500">*</span>
                </label>
                <input
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="e.g., Research Seminar on IoT"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date<span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={form.date}
                    onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Time<span className="text-red-500">*</span>
                  </label>
                  <input
                    type="time"
                    value={form.time}
                    onChange={(e) => setForm((f) => ({ ...f, time: e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Location
                </label>
                <input
                  value={form.location}
                  onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="e.g., Auditorium A / Zoom"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  rows={4}
                  value={form.description}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, description: e.target.value }))
                  }
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="Agenda, speakers, notes…"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-lg border border-gray-200 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold disabled:opacity-50"
                >
                  {saving ? "Saving…" : "Save Event"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
