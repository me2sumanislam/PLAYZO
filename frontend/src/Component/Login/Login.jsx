

import { useState } from "react";

const Login = ({ onLoginSuccess }) => {
  const [isRegister, setIsRegister] = useState(false);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState({ text: "", type: "" });

  const [loginData, setLoginData] = useState({ phone: "", password: "" });
  const [regData, setRegData] = useState({
    name: "", inGameName: "", email: "", phone: "", password: "", confirmPassword: "",
  });

  const showMsg = (text, type = "error") => {
    setMsg({ text, type });
    setTimeout(() => setMsg({ text: "", type: "" }), 4000);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("http://localhost:5000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...loginData, deviceType: "mobile" }),
      });
      const data = await res.json();
      if (data.success) {
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));
        onLoginSuccess();
      } else {
        showMsg(data.message || "Login failed");
      }
    } catch {
      showMsg("Server error");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (regData.password !== regData.confirmPassword) {
      showMsg("পাসওয়ার্ড মিলছে না");
      return;
    }
    if (regData.password.length < 6) {
      showMsg("পাসওয়ার্ড কমপক্ষে ৬ অক্ষর হতে হবে");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("http://localhost:5000/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(regData),
      });
      const data = await res.json();
      if (data.success) {
        showMsg("রেজিস্ট্রেশন সফল! এখন লগইন করো", "success");
        setIsRegister(false);
        setRegData({ name: "", inGameName: "", email: "", phone: "", password: "", confirmPassword: "" });
      } else {
        showMsg(data.message || "Registration failed");
      }
    } catch {
      showMsg("Server error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-[450px] min-h-screen bg-white flex flex-col justify-center px-8">

      {/* Logo */}
      <div className="mb-8 text-center">
        <h1 className="text-4xl font-black text-slate-800">
          PLAY<span className="text-orange-500">ZO</span>
        </h1>
        <p className="text-slate-400 mt-1 text-sm">Mobile Gaming Tournament</p>
      </div>

      {/* Tab Switch */}
      <div className="flex bg-gray-100 rounded-2xl p-1 mb-6">
        <button
          onClick={() => setIsRegister(false)}
          className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition ${
            !isRegister ? "bg-white text-gray-900 shadow" : "text-gray-400"
          }`}
        >
          লগইন
        </button>
        <button
          onClick={() => setIsRegister(true)}
          className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition ${
            isRegister ? "bg-white text-gray-900 shadow" : "text-gray-400"
          }`}
        >
          রেজিস্ট্রেশন
        </button>
      </div>

      {/* Message */}
      {msg.text && (
        <div className={`mb-4 px-4 py-3 rounded-xl text-sm font-medium text-center ${
          msg.type === "success" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
        }`}>
          {msg.text}
        </div>
      )}

      {/* LOGIN FORM */}
      {!isRegister && (
        <form onSubmit={handleLogin} className="space-y-4">
          <input
            type="text"
            placeholder="ফোন নম্বর"
            value={loginData.phone}
            onChange={(e) => setLoginData({ ...loginData, phone: e.target.value })}
            className="w-full p-4 border border-gray-200 rounded-2xl text-sm focus:outline-none focus:border-blue-400"
            required
          />
          <input
            type="password"
            placeholder="পাসওয়ার্ড"
            value={loginData.password}
            onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
            className="w-full p-4 border border-gray-200 rounded-2xl text-sm focus:outline-none focus:border-blue-400"
            required
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-[#56CCF2] to-[#2F80ED] text-white p-4 rounded-2xl font-bold active:scale-95 transition disabled:opacity-60"
          >
            {loading ? "লগইন হচ্ছে..." : "লগইন করো"}
          </button>
        </form>
      )}

      {/* REGISTER FORM */}
      {isRegister && (
        <form onSubmit={handleRegister} className="space-y-4">
          <input
            type="text"
            placeholder="তোমার আসল নাম *"
            value={regData.name}
            onChange={(e) => setRegData({ ...regData, name: e.target.value })}
            className="w-full p-4 border border-gray-200 rounded-2xl text-sm focus:outline-none focus:border-blue-400"
            required
          />
          <input
            type="text"
            placeholder="In-Game Name (Free Fire নাম) *"
            value={regData.inGameName}
            onChange={(e) => setRegData({ ...regData, inGameName: e.target.value })}
            className="w-full p-4 border border-gray-200 rounded-2xl text-sm focus:outline-none focus:border-blue-400"
            required
          />
          <input
            type="email"
            placeholder="ইমেইল (optional)"
            value={regData.email}
            onChange={(e) => setRegData({ ...regData, email: e.target.value })}
            className="w-full p-4 border border-gray-200 rounded-2xl text-sm focus:outline-none focus:border-blue-400"
          />
          <input
            type="text"
            placeholder="ফোন নম্বর *"
            value={regData.phone}
            onChange={(e) => setRegData({ ...regData, phone: e.target.value })}
            className="w-full p-4 border border-gray-200 rounded-2xl text-sm focus:outline-none focus:border-blue-400"
            required
          />
          <input
            type="password"
            placeholder="পাসওয়ার্ড (কমপক্ষে ৬ অক্ষর) *"
            value={regData.password}
            onChange={(e) => setRegData({ ...regData, password: e.target.value })}
            className="w-full p-4 border border-gray-200 rounded-2xl text-sm focus:outline-none focus:border-blue-400"
            required
          />
          <input
            type="password"
            placeholder="পাসওয়ার্ড আবার লেখো *"
            value={regData.confirmPassword}
            onChange={(e) => setRegData({ ...regData, confirmPassword: e.target.value })}
            className="w-full p-4 border border-gray-200 rounded-2xl text-sm focus:outline-none focus:border-blue-400"
            required
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-[#56CCF2] to-[#2F80ED] text-white p-4 rounded-2xl font-bold active:scale-95 transition disabled:opacity-60"
          >
            {loading ? "রেজিস্ট্রেশন হচ্ছে..." : "রেজিস্ট্রেশন করো"}
          </button>
        </form>
      )}

      <p className="text-center mt-6 text-xs text-gray-400">
        ⚠ Only Mobile Devices Allowed
      </p>
    </div>
  );
};

export default Login;