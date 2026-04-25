 import React, { useState } from "react";

const Login = ({ onLoginSuccess }) => {
  const [formData, setFormData] = useState({
    phone: "",
    password: "",
    deviceType: "mobile",
  });

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const res = await fetch("http://localhost:5000/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (data.success) {
        // 🔐 save token
        localStorage.setItem("token", data.token);

        alert("Login Successful 🎮");

        onLoginSuccess();
      } else {
        alert(data.message || "Login failed");
      }
    } catch (err) {
      console.log(err);
      alert("Server error");
    }
  };

  return (
    <div className="w-full max-w-[450px] min-h-screen bg-white flex flex-col justify-center px-8">

      <div className="mb-10 text-center">
        <h1 className="text-4xl font-black text-slate-800">
          GAME<span className="text-orange-500">ZONE</span>
        </h1>
        <p className="text-slate-500 mt-2">
          Mobile Gaming Tournament Login
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">

        {/* PHONE */}
        <input
          type="text"
          placeholder="Phone Number"
          className="w-full p-4 border rounded-2xl"
          onChange={(e) =>
            setFormData({ ...formData, phone: e.target.value })
          }
          required
        />

        {/* PASSWORD */}
        <input
          type="password"
          placeholder="Password"
          className="w-full p-4 border rounded-2xl"
          onChange={(e) =>
            setFormData({ ...formData, password: e.target.value })
          }
          required
        />

        {/* DEVICE LOCK (IMPORTANT IDEA) */}
        <input
          type="hidden"
          value="mobile"
        />

        <button
          type="submit"
          className="w-full bg-black text-white p-4 rounded-2xl font-bold active:scale-95"
        >
          LOGIN TO GAME
        </button>
      </form>

      <p className="text-center mt-6 text-sm text-gray-500">
        ⚠ Only Mobile Devices Allowed
      </p>

    </div>
  );
};

export default Login;