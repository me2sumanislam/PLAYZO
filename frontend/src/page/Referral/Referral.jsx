 // page/Referral/Referral.jsx
import React, { useState, useEffect } from "react";
import axios from "axios";

const API = import.meta.env.VITE_API_URL || "";

const Referral = ({ onBack, user, token }) => {
  const [referralData, setReferralData] = useState(null);
  const [loading, setLoading]           = useState(true);
  const [errorMsg, setErrorMsg]         = useState("");
  const [toast, setToast]               = useState("");
  const [toastType, setToastType]       = useState("info");

  const userId = user?.id || user?._id;

  useEffect(() => {
    if (userId) {
      fetchReferral();
    } else {
      setErrorMsg("User তথ্য পাওয়া যায়নি। আবার লগইন করুন।");
      setLoading(false);
    }
  }, [userId]);

  const fetchReferral = async () => {
    setLoading(true);
    setErrorMsg("");
    try {
      // ✅ Active/real referral endpoint — /api/referral/:userId
      const res = await axios.get(`${API}/api/referral/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.data.success) {
        setReferralData(res.data.data);
      } else {
        setErrorMsg("ডেটা লোড হয়নি।");
      }
    } catch (err) {
      console.error("Referral fetch error:", err);
      setErrorMsg("সার্ভার থেকে ডেটা আনতে পারেনি।");
    } finally {
      setLoading(false);
    }
  };

  const handleShare = () => {
    const code = referralData?.referralCode;
    if (!code) {
      setToast("⚠️ Referral code লোড হয়নি, একটু অপেক্ষা করুন।");
      setToastType("error");
      return;
    }
    const link = `https://playzo-eight.vercel.app?ref=${code}`;
    const text = `আমার referral code: ${code}\n${link}`;
    if (navigator.share) {
      navigator.share({ title: "Playzo তে যোগ দাও!", text: `আমার referral code: ${code}`, url: link });
    } else {
      navigator.clipboard.writeText(text);
      setToast("✅ লিংক কপি হয়েছে!");
      setToastType("info");
    }
  };

  // ✅ Gem System — gem কখনো taka তে convert হয় না, শুধু নির্দিষ্ট Gem-Entry match এ join করতে ব্যবহার হয়
  const gems = referralData?.gems || 0;
  const gemsEarnedCount = referralData?.referralHistory?.filter((r) => r.gemGiven).length || 0;

  const msgColors = {
    success: { bg: "#f0fdf4", border: "#bbf7d0", text: "#15803d" },
    error:   { bg: "#fff1f2", border: "#fecdd3", text: "#be123c" },
    info:    { bg: "#eff6ff", border: "#bfdbfe", text: "#1d4ed8" },
  };
  const mc = msgColors[toastType];

  if (loading) {
    return (
      <div className="bg-white min-h-screen flex flex-col items-center justify-center gap-3">
        <div className="w-10 h-10 border-4 border-orange-400 border-t-transparent rounded-full animate-spin" />
        <p className="text-gray-500 font-bold text-sm">লোড হচ্ছে...</p>
      </div>
    );
  }

  if (errorMsg) {
    return (
      <div className="bg-white min-h-screen flex flex-col items-center justify-center gap-4 px-8">
        <p className="text-4xl">😕</p>
        <p className="text-red-500 font-bold text-center">{errorMsg}</p>
        <button
          onClick={onBack}
          className="bg-orange-500 text-white px-6 py-3 rounded-2xl font-bold"
        >
          ← ফিরে যান
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white min-h-screen pb-10">
      {/* Header */}
      <div className="bg-gradient-to-b from-orange-400 to-orange-600 pt-12 pb-8 text-center text-white px-4 relative">
        <button onClick={onBack} className="absolute left-4 top-12 text-white font-bold text-2xl">←</button>
        <p className="text-4xl mb-2">🔷</p>
        <h2 className="text-xl font-black">Refer & Earn Gems</h2>
        <p className="text-orange-100 text-sm mt-1">বন্ধুদের invite করুন, Gem জিতুন!</p>
        <div className="mt-4 bg-white/20 rounded-2xl px-6 py-3 inline-block">
          <p className="text-xs text-orange-100">আপনার Gems</p>
          <p className="text-3xl font-black">🔷 {gems}</p>
          <p className="text-xs text-orange-100 mt-1">Gem দিয়ে শুধু নির্দিষ্ট ম্যাচে ফ্রি Entry নেওয়া যায়</p>
        </div>
      </div>

      <div className="px-4 mt-6 space-y-4">

        {/* Referral Code */}
        <div className="bg-orange-50 border border-orange-200 rounded-2xl p-4">
          <p className="text-xs text-gray-500 font-bold mb-1">আপনার Referral Code</p>
          <div className="flex items-center justify-between">
            <p className="text-2xl font-black text-orange-600 tracking-widest">
              {referralData?.referralCode || "—"}
            </p>
            <button
              onClick={handleShare}
              className="bg-orange-500 text-white px-4 py-2 rounded-xl font-bold text-sm"
            >
              Share 🔗
            </button>
          </div>
          <p className="text-xs text-gray-400 mt-2 break-all">
            https://playzo-eight.vercel.app?ref={referralData?.referralCode || "..."}
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-blue-50 rounded-2xl p-4 text-center">
            <p className="text-2xl font-black text-blue-600">{referralData?.referralCount || 0}</p>
            <p className="text-xs text-gray-500 font-bold">মোট Refer</p>
          </div>
          <div className="bg-green-50 rounded-2xl p-4 text-center">
            <p className="text-2xl font-black text-green-600">{gemsEarnedCount}</p>
            <p className="text-xs text-gray-500 font-bold">Gem পেয়েছি</p>
          </div>
        </div>

        {/* How it works */}
        <div className="bg-gray-50 rounded-2xl p-4">
          <p className="font-black text-sm mb-3">কীভাবে কাজ করে?</p>
          <div className="space-y-2 text-sm">
            {[
              "১. আপনার code দিয়ে বন্ধু register করবে",
              "২. বন্ধু ৳৫০+ deposit করবে",
              "৩. বন্ধু যেকোনো একটি match join করবে",
              "৪. আপনি Gem পাবেন — ৳১০০ deposit এ ১০ Gem, ৳৫০ deposit এ ৫ Gem",
              "৫. Gem দিয়ে 🔷 Gem-Entry ম্যাচগুলোতে ফ্রি join করতে পারবেন (taka তে convert হয় না)",
            ].map((text, i) => (
              <div key={i} className="flex gap-3 items-start">
                <span className="w-6 h-6 bg-orange-500 text-white rounded-full flex items-center justify-center text-xs font-black flex-shrink-0 mt-0.5">
                  {i + 1}
                </span>
                <p className="text-gray-600">{text}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Gem Info Box */}
        <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-4 flex items-start gap-3">
          <span className="text-2xl">ℹ️</span>
          <p className="text-xs text-indigo-700 leading-relaxed">
            <b>Gem কখনো টাকায় convert করা যায় না।</b> Match লিস্টে "🔷 Gem Entry" ব্যাজ দেখা যেসব ম্যাচে,
            সেগুলোতেই আপনি Gem ব্যবহার করে বিনা টাকায় join করতে পারবেন।
          </p>
        </div>

        {/* Toast */}
        {toast && (
          <div style={{ background: mc.bg, border: `1px solid ${mc.border}`, color: mc.text, padding: "12px 16px", borderRadius: 14, textAlign: "center", fontSize: 13, fontWeight: 600 }}>
            {toast}
          </div>
        )}

        {/* Referral History */}
        {referralData?.referralHistory?.length > 0 && (
          <div>
            <p className="font-black text-sm mb-3">Referral History</p>
            <div className="space-y-2">
              {referralData.referralHistory.map((r, i) => {
                let badge;
                if (r.gemGiven) {
                  badge = <span className="bg-green-100 text-green-700 text-xs px-3 py-1 rounded-full font-bold">🔷 +{r.gemsPending || 0} Gem ✅</span>;
                } else if (r.deposited) {
                  badge = <span className="bg-blue-100 text-blue-700 text-xs px-3 py-1 rounded-full font-semibold">Match পেন্ডিং ⏳ (🔷{r.gemsPending || 0} অপেক্ষায়)</span>;
                } else {
                  badge = <span className="bg-gray-200 text-gray-500 text-xs px-3 py-1 rounded-full">Deposit পেন্ডিং</span>;
                }
                return (
                  <div key={i} className="bg-gray-50 rounded-xl p-3 flex justify-between items-center">
                    <div>
                      <p className="font-medium">{r.name || "Unknown"}</p>
                      <p className="text-xs text-gray-500">{r.phone}</p>
                    </div>
                    <div>{badge}</div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default Referral;