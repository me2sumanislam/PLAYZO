 // page/Auth/Auth.jsx
import React, { useState, useEffect } from "react";
import { Eye, EyeOff } from "lucide-react";
import { useSearchParams } from "react-router-dom";

const API_BASE = "https://playzo-vn8e.onrender.com/api";

// ✅ একটা persistent deviceId বানায়/পড়ে — same device থেকে multiple fake account ধরতে সাহায্য করে
function getDeviceId() {
  let id = localStorage.getItem("deviceId");
  if (!id) {
    id = "dev_" + Math.random().toString(36).slice(2) + Date.now().toString(36);
    localStorage.setItem("deviceId", id);
  }
  return id;
}

const PasswordInput = ({ placeholder, value, onChange, required, autoComplete, className }) => {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <input
        type={show ? "text" : "password"}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        autoComplete={autoComplete}
        className={className}
        required={required}
      />
      <button
        type="button"
        onClick={() => setShow(!show)}
        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 active:text-gray-600"
      >
        {show ? <EyeOff size={20} /> : <Eye size={20} />}
      </button>
    </div>
  );
};

const Auth = ({ onLoginSuccess }) => {
  const [screen, setScreen] = useState("login");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const [loginData, setLoginData] = useState({ phone: "", password: "" });
  const [regData, setRegData] = useState({
    name: "", phone: "", password: "", confirm: "",
    referralCode: ""
  });
  const [agreedTerms, setAgreedTerms] = useState(false);

  // ✅ Forgot password — এখন ৩ ধাপ: (1) ফোন দিয়ে OTP রিকোয়েস্ট (2) OTP verify (3) নতুন পাসওয়ার্ড
  const [forgotPhone, setForgotPhone] = useState("");
  const [forgotOtp, setForgotOtp] = useState("");
  const [newPass, setNewPass] = useState("");
  const [forgotStep, setForgotStep] = useState(1);

  // ✅ Migrated user first-login password reset (needsPasswordReset flag)
  // এখন phone দিয়ে না, বরং already-logged-in token দিয়ে করা হয়
  const [mustResetToken, setMustResetToken] = useState("");
  const [mustResetPass, setMustResetPass] = useState("");

  const [searchParams] = useSearchParams();

  useEffect(() => {
    const refCode = searchParams.get("ref");
    if (refCode) {
      setRegData((prev) => ({ ...prev, referralCode: refCode.toUpperCase() }));
      setScreen("register");
    }
  }, [searchParams]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: loginData.phone, password: loginData.password }),
      });
      const data = await res.json();
      if (data.success) {
        localStorage.setItem("token", data.token);
        localStorage.setItem("isAdmin", "false");
        localStorage.setItem("user", JSON.stringify(data.user));

        if (data.needsPasswordReset) {
          // ✅ token টা এখানেই ধরে রাখা হচ্ছে — change-password কল করতে লাগবে
          setMustResetToken(data.token);
          setMustResetPass("");
          setScreen("mustReset");
        } else {
          onLoginSuccess();
        }
      } else {
        setError(data.message || "Login failed!");
      }
    } catch {
      setError("Server error! Backend চালু আছে?");
    }
    setLoading(false);
  };

  // ✅ মাইগ্রেটেড ইউজারের বাধ্যতামূলক নতুন পাসওয়ার্ড সেট করার handler
  // এখন phone না পাঠিয়ে, লগইন করার সময় পাওয়া token দিয়ে authenticated route কল করা হয়
  const handleMustReset = async (e) => {
    e.preventDefault();
    setError("");
    if (!mustResetPass || mustResetPass.length < 8) {
      setError("পাসওয়ার্ড কমপক্ষে ৮ অক্ষর হতে হবে!");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/auth/change-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${mustResetToken}`,
        },
        body: JSON.stringify({ password: mustResetPass }),
      });
      const data = await res.json();
      if (data.success) {
        onLoginSuccess();
      } else {
        setError(data.message || "পাসওয়ার্ড পরিবর্তন করা যায়নি!");
      }
    } catch {
      setError("Server error! Backend চালু আছে?");
    }
    setLoading(false);
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");
    if (!regData.name || !regData.phone || !regData.password) {
      setError("সব তথ্য পূরণ করুন!"); return;
    }
    if (regData.password !== regData.confirm) {
      setError("পাসওয়ার্ড মিলছে না!"); return;
    }
    if (regData.password.length < 8) {
      setError("পাসওয়ার্ড কমপক্ষে ৮ অক্ষর হতে হবে!"); return;
    }
    if (!agreedTerms) {
      setError("শর্তাবলী মেনে নিতে হবে!"); return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: regData.name,
          phone: regData.phone,
          password: regData.password,
          referralCode: regData.referralCode.trim().toUpperCase() || null,
          deviceId: getDeviceId(),
        }),
      });
      const data = await res.json();
      if (data.success) {
        localStorage.setItem("token", data.token);
        localStorage.setItem("isAdmin", "false");
        localStorage.setItem("user", JSON.stringify(data.user));

        const url = new URL(window.location.href);
        url.searchParams.delete("ref");
        window.history.replaceState({}, "", url.toString());

        onLoginSuccess();
      } else {
        setError(data.message || "Registration failed!");
      }
    } catch {
      setError("Server error! Backend চালু আছে?");
    }
    setLoading(false);
  };

  // ---- STEP 1: ফোন নাম্বার দিয়ে OTP রিকোয়েস্ট ----
  const handleForgotStep1 = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    if (!forgotPhone) { setError("ফোন নাম্বার দিন!"); return; }
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/auth/forgot-password/request`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: forgotPhone }),
      });
      const data = await res.json();
      // ✅ backend সবসময় generic success message দেয় (user-enumeration ঠেকাতে),
      // তাই সেটাই দেখিয়ে পরের ধাপে নিয়ে যাওয়া হচ্ছে
      if (data.success) {
        setForgotStep(2);
        setSuccess("SMS-এ পাঠানো OTP কোডটি লিখুন। অ্যাকাউন্ট না থাকলে কোনো SMS আসবে না।");
      } else {
        setError(data.message || "সমস্যা হয়েছে, আবার চেষ্টা করুন");
      }
    } catch {
      setError("Server error! Backend চালু আছে?");
    }
    setLoading(false);
  };

  // ---- STEP 2: OTP verify ----
  const handleForgotStep2 = (e) => {
    e.preventDefault();
    setError("");
    if (!forgotOtp || forgotOtp.length !== 6) {
      setError("৬ ডিজিটের OTP কোড দিন!");
      return;
    }
    setSuccess("এখন নতুন পাসওয়ার্ড দিন।");
    setForgotStep(3);
  };

  // ---- STEP 3: OTP + নতুন পাসওয়ার্ড দিয়ে সাবমিট ----
  const handleForgotStep3 = async (e) => {
    e.preventDefault();
    setError("");
    if (!newPass || newPass.length < 8) {
      setError("পাসওয়ার্ড কমপক্ষে ৮ অক্ষর হতে হবে!");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/auth/forgot-password/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: forgotPhone, otp: forgotOtp, password: newPass }),
      });
      const data = await res.json();
      if (data.success) {
        setSuccess("পাসওয়ার্ড পরিবর্তন সফল হয়েছে! এখন লগইন করুন।");
        setTimeout(() => {
          setScreen("login");
          setSuccess("");
          setForgotStep(1);
          setForgotPhone("");
          setForgotOtp("");
          setNewPass("");
        }, 2000);
      } else {
        setError(data.message || "Failed! OTP ভুল হতে পারে অথবা মেয়াদ শেষ হয়ে গেছে।");
      }
    } catch {
      setError("Server error! Backend চালু আছে?");
    }
    setLoading(false);
  };

  const inputClass = "w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:border-orange-500 transition-all font-medium";
  const switchScreen = (s) => {
    setScreen(s);
    setError("");
    setSuccess("");
    setForgotStep(1);
    setForgotOtp("");
  };

  return (
    <div className="w-full max-w-[450px] min-h-screen bg-white flex flex-col justify-start px-8 mx-auto pt-24">

      <div className="mb-8 text-center">
        <h1 className="text-4xl font-black text-slate-800">
          uth<span className="text-orange-500">iyO</span>
        </h1>
        <p className="text-slate-500 mt-1 text-sm">
          {screen === "login" && "আপনার অ্যাকাউন্টে লগইন করুন"}
          {screen === "register" && "নতুন অ্যাকাউন্ট তৈরি করুন"}
          {screen === "forgot" && "পাসওয়ার্ড রিসেট করুন"}
          {screen === "mustReset" && "নিরাপত্তার জন্য নতুন পাসওয়ার্ড সেট করুন"}
        </p>
      </div>

      {/* Tab Switcher */}
      {screen !== "forgot" && screen !== "mustReset" && (
        <div className="flex bg-slate-100 rounded-2xl p-1 mb-6">
          <button
            onClick={() => switchScreen("login")}
            className={`flex-1 py-2.5 rounded-xl font-bold text-sm transition ${screen === "login" ? "bg-white shadow text-slate-800" : "text-slate-500"}`}
          >
            লগইন
          </button>
          <button
            onClick={() => switchScreen("register")}
            className={`flex-1 py-2.5 rounded-xl font-bold text-sm transition ${screen === "register" ? "bg-white shadow text-slate-800" : "text-slate-500"}`}
          >
            রেজিস্ট্রেশন
          </button>
        </div>
      )}

      {/* Error / Success */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 rounded-2xl px-4 py-3 text-sm font-bold mb-4 text-center">
          {error}
        </div>
      )}
      {success && (
        <div className="bg-green-50 border border-green-200 text-green-600 rounded-2xl px-4 py-3 text-sm font-bold mb-4 text-center">
          {success}
        </div>
      )}

      {/* LOGIN FORM */}
      {screen === "login" && (
        <form onSubmit={handleLogin} className="space-y-4">
          <input
            type="text"
            placeholder="ফোন নাম্বার"
            className={inputClass}
            value={loginData.phone}
            onChange={(e) => setLoginData({ ...loginData, phone: e.target.value })}
            autoComplete="tel"
            required
          />
          <PasswordInput
            placeholder="পাসওয়ার্ড"
            className={`${inputClass} pr-12`}
            value={loginData.password}
            onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
            autoComplete="current-password"
            required
          />
          <div className="text-right">
            <button type="button" onClick={() => switchScreen("forgot")} className="text-orange-500 font-bold text-sm">
              পাসওয়ার্ড ভুলে গেছেন?
            </button>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-black text-white p-4 rounded-2xl font-bold text-lg active:scale-95 transition disabled:opacity-50"
          >
            {loading ? "লগইন হচ্ছে..." : "লগইন করুন"}
          </button>
        </form>
      )}

      {/* REGISTER FORM */}
      {screen === "register" && (
        <form onSubmit={handleRegister} className="space-y-4">
          <input
            type="text"
            placeholder="আপনার নাম"
            className={inputClass}
            value={regData.name}
            onChange={(e) => setRegData({ ...regData, name: e.target.value })}
            autoComplete="name"
            required
          />
          <input
            type="text"
            placeholder="ফোন নাম্বার"
            className={inputClass}
            value={regData.phone}
            onChange={(e) => setRegData({ ...regData, phone: e.target.value })}
            autoComplete="tel"
            required
          />
          <PasswordInput
            placeholder="পাসওয়ার্ড"
            className={`${inputClass} pr-12`}
            value={regData.password}
            onChange={(e) => setRegData({ ...regData, password: e.target.value })}
            autoComplete="new-password"
            required
          />
          <PasswordInput
            placeholder="পাসওয়ার্ড আবার লিখুন"
            className={`${inputClass} pr-12`}
            value={regData.confirm}
            onChange={(e) => setRegData({ ...regData, confirm: e.target.value })}
            autoComplete="new-password"
            required
          />

          <div className="relative">
            <input
              type="text"
              placeholder="রেফারেল কোড (optional)"
              className={`${inputClass} ${regData.referralCode ? "border-orange-400 bg-orange-50" : ""}`}
              value={regData.referralCode}
              onChange={(e) => setRegData({ ...regData, referralCode: e.target.value.toUpperCase() })}
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-lg">🎁</span>
          </div>

          {regData.referralCode && (
            <div className="bg-orange-50 border border-orange-200 rounded-xl px-4 py-2 text-xs text-orange-700 font-bold">
              🎁 রেফারেল কোড: {regData.referralCode.toUpperCase()} — আপনার বন্ধু Gem পাবে!
            </div>
          )}

          <div className="flex items-start gap-3 bg-slate-50 border border-slate-200 rounded-2xl p-4">
            <input
              type="checkbox"
              id="terms"
              checked={agreedTerms}
              onChange={(e) => setAgreedTerms(e.target.checked)}
              className="mt-1 w-4 h-4 accent-orange-500 cursor-pointer flex-shrink-0"
            />
            <label htmlFor="terms" className="text-sm text-slate-600 cursor-pointer leading-relaxed">
              আমি <span className="text-orange-500 font-bold">শর্তাবলী ও নীতিমালা</span> পড়েছি এবং মেনে নিচ্ছি
            </label>
          </div>

          <button
            type="submit"
            disabled={loading || !agreedTerms}
            className="w-full bg-black text-white p-4 rounded-2xl font-bold text-lg active:scale-95 transition disabled:opacity-50"
          >
            {loading ? "হচ্ছে..." : "রেজিস্ট্রেশন করুন"}
          </button>
        </form>
      )}

      {/* FORGOT PASSWORD — এখন ৩ ধাপ: ফোন → OTP → নতুন পাসওয়ার্ড */}
      {screen === "forgot" && (
        <div>
          <button onClick={() => switchScreen("login")} className="flex items-center gap-2 text-gray-500 font-bold text-sm mb-6">
            ← লগইনে ফিরে যান
          </button>

          {forgotStep === 1 && (
            <form onSubmit={handleForgotStep1} className="space-y-4">
              <div className="bg-orange-50 border border-orange-200 rounded-2xl p-4 text-center mb-2">
                <p className="text-2xl mb-1">🔐</p>
                <p className="text-sm font-bold text-orange-700">আপনার রেজিস্ট্রেশন করা ফোন নাম্বার দিন</p>
              </div>
              <input
                type="text"
                placeholder="ফোন নাম্বার"
                className={inputClass}
                value={forgotPhone}
                onChange={(e) => setForgotPhone(e.target.value)}
                autoComplete="tel"
                required
              />
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-orange-500 text-white p-4 rounded-2xl font-bold text-lg active:scale-95 transition disabled:opacity-50"
              >
                {loading ? "পাঠানো হচ্ছে..." : "OTP পাঠান →"}
              </button>
            </form>
          )}

          {forgotStep === 2 && (
            <form onSubmit={handleForgotStep2} className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 text-center mb-2">
                <p className="text-2xl mb-1">📩</p>
                <p className="text-sm font-bold text-blue-700">{forgotPhone}-এ পাঠানো ৬ ডিজিটের কোড দিন</p>
              </div>
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                placeholder="৬ ডিজিটের OTP"
                className={`${inputClass} text-center tracking-[8px] text-xl font-bold`}
                value={forgotOtp}
                onChange={(e) => setForgotOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                required
              />
              <button
                type="submit"
                className="w-full bg-black text-white p-4 rounded-2xl font-bold text-lg active:scale-95 transition"
              >
                পরবর্তী ধাপ →
              </button>
              <button
                type="button"
                onClick={() => { setForgotStep(1); setForgotOtp(""); setError(""); setSuccess(""); }}
                className="w-full text-gray-500 font-bold text-sm py-2"
              >
                ফোন নাম্বার বদলাতে চান? আবার দিন
              </button>
            </form>
          )}

          {forgotStep === 3 && (
            <form onSubmit={handleForgotStep3} className="space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-2xl p-4 text-center mb-2">
                <p className="text-2xl mb-1">✅</p>
                <p className="text-sm font-bold text-green-700">OTP সঠিক! এখন নতুন পাসওয়ার্ড দিন</p>
              </div>
              <PasswordInput
                placeholder="নতুন পাসওয়ার্ড"
                className={`${inputClass} pr-12`}
                value={newPass}
                onChange={(e) => setNewPass(e.target.value)}
                autoComplete="new-password"
                required
              />
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-black text-white p-4 rounded-2xl font-bold text-lg active:scale-95 transition disabled:opacity-50"
              >
                {loading ? "হচ্ছে..." : "পাসওয়ার্ড পরিবর্তন করুন"}
              </button>
            </form>
          )}
        </div>
      )}

      {/* ✅ MUST RESET PASSWORD — migrated user first login (token দিয়ে, phone দিয়ে না) */}
      {screen === "mustReset" && (
        <form onSubmit={handleMustReset} className="space-y-4">
          <div className="bg-orange-50 border border-orange-200 rounded-2xl p-4 text-center mb-2">
            <p className="text-2xl mb-1">🔒</p>
            <p className="text-sm font-bold text-orange-700">
              আমরা আমাদের সিস্টেম আপডেট করেছি — চালিয়ে যেতে একটি নতুন পাসওয়ার্ড সেট করুন
            </p>
          </div>
          <PasswordInput
            placeholder="নতুন পাসওয়ার্ড"
            className={`${inputClass} pr-12`}
            value={mustResetPass}
            onChange={(e) => setMustResetPass(e.target.value)}
            autoComplete="new-password"
            required
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-black text-white p-4 rounded-2xl font-bold text-lg active:scale-95 transition disabled:opacity-50"
          >
            {loading ? "হচ্ছে..." : "পাসওয়ার্ড সেট করুন ও চালিয়ে যান"}
          </button>
        </form>
      )}

      <p className="text-center mt-6 text-xs text-gray-400">
        ⚠ Only Mobile Devices Allowed
      </p>
    </div>
  );
};

export default Auth;