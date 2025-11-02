import React from "react";

function LogoutButton({ onLogout }) {
  return (
    <button
      onClick={onLogout}
      className="bg-red-500 hover:bg-red-600 text-white py-2 rounded-md"
    >
      Logout
    </button>
  );
}

export default LogoutButton;
