 import React, { useState } from "react";
import api from "../../utils/api";

const AdminLogin = ({ onLoginSuccess }) => {
  const [formData, setFormData] = useState({ phone: "", password: "" });
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErr("");
    setLoading(true);
    try {
      const res = await api("/admin/login", {
        method: "POST",
        body: JSON.stringify(formData),
      });
      if (res?.success && res?.token) {
        localStorage.setItem("adminToken", res.token);
        const adminData = res.admin ||
          res.user || {
            name: formData.phone || "Admin",
            role: "admin",
            phone: formData.phone,
          };
        localStorage.setItem("adminInfo", JSON.stringify(adminData));
        onLoginSuccess(adminData);
      } else {
        setErr(res?.message || "লগইন ব্যর্থ হয়েছে");
      }
    } catch {
      setErr("সার্ভারে সমস্যা হয়েছে");
    }
    setLoading(false);
  };

  return (
    <div className="w-full max-w-[450px] min-h-screen mx-auto bg-white flex flex-col justify-center px-8 shadow-2xl">
      <div className="mb-10 text-center">
        <h1 className="text-4xl font-black text-slate-800 tracking-tighter">
          uthi<span className="text-orange-500">YO</span>
        </h1>
        <p className="text-slate-500 mt-2 font-medium">Admin প্যানেলে লগইন করুন</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-sm font-bold text-slate-700 mb-2">
            ফোন নাম্বার
          </label>
          <input
            type="text"
            placeholder="01XXXXXXXXX"
            value={formData.phone}
            className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:border-orange-500 transition-all"
            onChange={(e) =>
              setFormData({ ...formData, phone: e.target.value })
            }
            required
          />
        </div>

        <div>
          <label className="block text-sm font-bold text-slate-700 mb-2">
            পাসওয়ার্ড
          </label>
          <input
            type="password"
            placeholder="******"
            value={formData.password}
            className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:border-orange-500 transition-all"
            onChange={(e) =>
              setFormData({ ...formData, password: e.target.value })
            }
            required
          />
        </div>

        {err && (
          <div className="bg-red-50 text-red-600 text-sm font-semibold rounded-xl px-4 py-3">
            {err}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-slate-900 text-white p-4 rounded-2xl font-bold text-lg hover:bg-black transition-all shadow-lg active:scale-95 disabled:opacity-50"
        >
          {loading ? "লগইন হচ্ছে..." : "লগইন করুন"}
        </button>
      </form>
    </div>
  );
};

export default AdminLogin;