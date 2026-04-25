 import React, { useState } from "react";

const AdminLogin = ({ onLogin }) => {
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("http://localhost:5000/api/admin/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ phone, password }),
      });

      const data = await res.json();

      if (data.success) {
        localStorage.setItem("adminToken", data.token);
        localStorage.setItem("role", data.user.role);

        alert("Admin Login Success 🚀");

        onLogin(); // go to admin panel
      } else {
        alert(data.message);
      }
    } catch (err) {
      console.log(err);
      alert("Server error");
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">
      <form
        onSubmit={handleLogin}
        className="bg-gray-800 p-8 rounded-2xl w-[90%] max-w-sm space-y-4"
      >
        <h2 className="text-2xl font-bold text-center text-orange-500">
          Admin Login
        </h2>

        <input
          type="text"
          placeholder="Phone"
          className="w-full p-3 rounded bg-gray-700"
          onChange={(e) => setPhone(e.target.value)}
          required
        />

        <input
          type="password"
          placeholder="Password"
          className="w-full p-3 rounded bg-gray-700"
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-orange-500 p-3 rounded font-bold"
        >
          {loading ? "Logging..." : "LOGIN"}
        </button>
      </form>
    </div>
  );
};

export default AdminLogin;