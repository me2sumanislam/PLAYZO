 import { useState, useEffect } from "react";

// API URL ঠিক করা হয়েছে যেন শেষে বাড়তি /api ডাবল না হয়
const API_BASE = import.meta.env.VITE_API_URL || "https://playzo-vn8e.onrender.com/api";
const CLEAN_API_URL = API_BASE.endsWith("/api") ? API_BASE : `${API_BASE}/api`;

const AccountInfo = ({ onBack }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pwForm, setPwForm] = useState({ oldPassword: "", newPassword: "", confirmPassword: "" });
  const [showPwSection, setShowPwSection] = useState(false);
  const [msg, setMsg] = useState({ text: "", type: "" });
  const [saving, setSaving] = useState(false);

  const token = localStorage.getItem("token");

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch(`${CLEAN_API_URL}/users/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (data.success) setUser(data.user);
      } catch (err) {
        console.log(err);
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, []);

  const showMsg = (text, type = "success") => {
    setMsg({ text, type });
    setTimeout(() => setMsg({ text: "", type: "" }), 3000);
  };

  const handleChangePassword = async () => {
    if (pwForm.newPassword !== pwForm.confirmPassword) {
      showMsg("নতুন পাসওয়ার্ড মিলছে না", "error");
      return;
    }
    if (pwForm.newPassword.length < 6) {
      showMsg("পাসওয়ার্ড কমপক্ষে ৬ অক্ষর হতে হবে", "error");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`${CLEAN_API_URL}/users/change-password`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          oldPassword: pwForm.oldPassword,
          newPassword: pwForm.newPassword,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setPwForm({ oldPassword: "", newPassword: "", confirmPassword: "" });
        setShowPwSection(false);
        showMsg("পাসওয়ার্ড পরিবর্তন হয়েছে ✅");
      } else {
        showMsg(data.message, "error");
      }
    } catch {
      showMsg("কিছু একটা সমস্যা হয়েছে", "error");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-8 h-8 border-4 border-blue-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen pb-10">

      {/* Header */}
      <div className="bg-gradient-to-b from-[#56CCF2] to-[#2F80ED] px-4 pt-12 pb-6 flex items-center gap-3">
        <button
          onClick={onBack}
          className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white text-lg font-bold"
        >
          ‹
        </button>
        <h1 className="text-white font-bold text-lg">Account Info</h1>
      </div>

      {/* Toast */}
      {msg.text && (
        <div className={`mx-4 mt-4 px-4 py-3 rounded-xl text-sm font-medium text-center ${
          msg.type === "error" ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"
        }`}>
          {msg.text}
        </div>
      )}

      <div className="px-4 py-5 space-y-4">

        {/* Avatar Card */}
        <div className="bg-white rounded-2xl p-5 flex items-center gap-4 shadow-sm border border-gray-100">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-3xl shadow">
            👤
          </div>
          <div>
            <div className="font-bold text-gray-900 text-base">{user?.name || "—"}</div>
            <div className="text-xs text-gray-400 mt-0.5">{user?.phone}</div>
            <span className="text-[10px] bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full font-bold mt-1 inline-block uppercase">
              {user?.role || "user"}
            </span>
          </div>
        </div>

        {/* Info Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-50">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">ব্যক্তিগত তথ্য</span>
          </div>

          {[
            { label: "আসল নাম", value: user?.name },
            { label: "In-Game Name", value: user?.inGameName },
            { label: "ইমেইল", value: user?.email },
            { label: "ফোন নম্বর", value: user?.phone },
            {
              label: "যোগদানের তারিখ",
              value: user?.createdAt
                ? new Date(user.createdAt).toLocaleDateString("bn-BD", {
                    year: "numeric", month: "long", day: "numeric",
                  })
                : null,
            },
          ].map((item, i, arr) => (
            <div key={i} className={`px-4 py-3.5 ${i !== arr.length - 1 ? "border-b border-gray-50" : ""}`}>
              <div className="text-[10px] text-gray-400 font-semibold uppercase mb-1">{item.label}</div>
              <div className="text-sm text-gray-800 font-medium">
                {item.value || <span className="text-gray-300">দেওয়া হয়নি</span>}
              </div>
            </div>
          ))}
        </div>

        {/* Stats Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-50">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">গেমিং স্ট্যাটস</span>
          </div>
          <div className="grid grid-cols-3 divide-x divide-gray-50">
            <div className="px-3 py-4 text-center">
              {/* ফিক্সড: ৳ সাইন এবং দশমিকের পর নিখুঁত ২ ঘর (.00) ফরম্যাট */}
              <div className="text-sm font-black text-gray-900 truncate">
                ৳ {(user?.balance ?? 0).toLocaleString('en-BD', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <div className="text-[10px] text-gray-400 font-semibold mt-1 uppercase">ব্যালেন্স</div>
            </div>
            <div className="px-3 py-4 text-center">
              <div className="text-xl font-black text-gray-900">{user?.totalMatchesPlayed ?? 0}</div>
              <div className="text-[10px] text-gray-400 font-semibold mt-0.5 uppercase">ম্যাচ</div>
            </div>
            <div className="px-3 py-4 text-center">
              <div className="text-xl font-black text-gray-900">{user?.totalWins ?? 0}</div>
              <div className="text-[10px] text-gray-400 font-semibold mt-0.5 uppercase">জয়</div>
            </div>
          </div>
        </div>

        {/* Change Password */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <button
            onClick={() => setShowPwSection(!showPwSection)}
            className="w-full px-4 py-4 flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <span className="text-xl">🔑</span>
              <span className="text-sm font-bold text-gray-700">পাসওয়ার্ড পরিবর্তন</span>
            </div>
            <span className="text-gray-400 text-lg">{showPwSection ? "∧" : "›"}</span>
          </button>

          {showPwSection && (
            <div className="px-4 pb-4 space-y-3 border-t border-gray-50">
              <input
                type="password"
                value={pwForm.oldPassword}
                onChange={(e) => setPwForm({ ...pwForm, oldPassword: e.target.value })}
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:border-blue-400 mt-3"
                placeholder="পুরনো পাসওয়ার্ড"
              />
              <input
                type="password"
                value={pwForm.newPassword}
                onChange={(e) => setPwForm({ ...pwForm, newPassword: e.target.value })}
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:border-blue-400"
                placeholder="নতুন পাসওয়ার্ড (কমপক্ষে ৬ অক্ষর)"
              />
              <input
                type="password"
                value={pwForm.confirmPassword}
                onChange={(e) => setPwForm({ ...pwForm, confirmPassword: e.target.value })}
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:border-blue-400"
                placeholder="নতুন পাসওয়ার্ড আবার লেখো"
              />
              <button
                onClick={handleChangePassword}
                disabled={saving}
                className="w-full py-3 bg-gradient-to-r from-[#56CCF2] to-[#2F80ED] text-white rounded-xl font-bold text-sm disabled:opacity-60 text-center"
              >
                {saving ? "পরিবর্তন হচ্ছে..." : "পাসওয়ার্ড পরিবর্তন করো"}
              </button>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default AccountInfo;