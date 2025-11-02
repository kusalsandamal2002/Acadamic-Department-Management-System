import React, { useState, useEffect } from "react";
import axios from "axios";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  FaHome,
  FaBook,
  FaUserGraduate,
  FaChalkboard,
  FaUserCircle,
  FaSignOutAlt,
  FaBell,
  FaCalendarAlt, // ⬅️ NEW
} from "react-icons/fa";

export default function LecturerDashboard() {
  const navigate = useNavigate();
  const [userData, setUserData] = useState({ name: "Lecturer", role: "Loading..." });
  const [loadingUser, setLoadingUser] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) {
      setLoadingUser(false);
      navigate("/login");
      return;
    }

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
      .catch((err) => {
        console.error("Profile fetch failed:", err?.response?.data || err.message);
        const cached = localStorage.getItem("userData");
        if (cached) {
          try {
            const parsed = JSON.parse(cached);
            setUserData({
              name: parsed.name || "Lecturer",
              role: parsed.role || "Lecturer",
            });
          } catch (_) {}
        } else {
          localStorage.removeItem("token");
          localStorage.removeItem("userData");
          navigate("/login");
        }
      })
      .finally(() => setLoadingUser(false));
  }, [navigate]);

  const handleLogout = () => {
    try {
      localStorage.removeItem("token");
      localStorage.removeItem("userData");
    } catch (_) {}
    navigate("/login");
  };

  const linkBase =
    "flex items-center gap-3 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ease-in-out";
  const activeCls = "bg-emerald-600 text-white shadow-md shadow-emerald-200";
  const idleCls = "text-slate-600 hover:bg-emerald-50 hover:text-emerald-700";

  const navItems = [
    { name: "Overview", to: "/lecturer", icon: <FaHome /> },
    { name: "Courses", to: "/lecturer/courses", icon: <FaBook /> },
    { name: "Students", to: "/lecturer/students", icon: <FaUserGraduate /> },
    { name: "Lecture Halls", to: "/lecturer/lecture-halls", icon: <FaChalkboard /> },
    { name: "Events", to: "/lecturer/events", icon: <FaCalendarAlt /> }, // ⬅️ NEW
    { name: "Profile", to: "/lecturer/profile", icon: <FaUserCircle /> },
  ];

  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 shadow-xl flex flex-col fixed h-full z-10">
        <div className="p-6 text-3xl font-extrabold text-emerald-800 border-b border-gray-100">
          Edu-Portal
        </div>

        <nav className="flex-1 p-4 flex flex-col gap-1 overflow-y-auto">
          <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-2 px-4">
            Navigation
          </p>
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              end={item.to === "/lecturer"}
              to={item.to}
              className={({ isActive }) =>
                `${linkBase} ${isActive ? activeCls : idleCls}`
              }
            >
              {item.icon} <span className="truncate">{item.name}</span>
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-gray-100">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors duration-200"
          >
            <FaSignOutAlt /> Logout
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 ml-64 flex flex-col">
        {/* Header */}
        <header className="bg-white shadow-sm h-16 flex items-center justify-between px-8 border-b border-gray-200 sticky top-0 z-0">
          <h1 className="text-xl font-bold text-gray-800">Lecturer Dashboard</h1>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <FaUserCircle className="text-2xl text-emerald-600" />
              <div className="text-right">
                <p className="text-sm font-semibold text-gray-700">
                  {loadingUser ? "Loading..." : userData.name}
                </p>
                <p className="text-xs text-gray-500">
                  {loadingUser ? "Please wait" : userData.role}
                </p>
              </div>
            </div>

            <button className="p-2 text-gray-500 hover:text-emerald-600 transition-colors rounded-full hover:bg-gray-100">
              <FaBell className="text-xl" />
            </button>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 p-8 overflow-auto">
          <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
