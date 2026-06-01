 // page/Referral/Referral.jsx
import React, { useState, useEffect } from "react";
import axios from "axios";

const API = import.meta.env.VITE_API_URL || "";

const Referral = ({ onBack, user, token }) => {
  const [referralData, setReferralData] = useState(null);
  const [converting, setConverting]     = useState(false);
  const [convertMsg, setConvertMsg]     = useState("");
  const [msgType, setMsgType]           = useState("success");
  const [loading, setLoading]           = useState(true);
  const [errorMsg, setErrorMsg]         = useState("");

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
      const res = await axios.get(`${API}/api/wallet/referral/${userId}`, {
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

  const handleConvert = async () => {
    setConverting(true);
    setConvertMsg("");
    try {
      const res = await axios.post(
        `${API}/api/wallet/referral/convert`,
        { userId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setConvertMsg(res.data.message || "সফল হয়েছে!");
      setMsgType(res.data.success ? "success" : "error");
      if (res.data.success) fetchReferral();
    } catch {
      setConvertMsg("এরর হয়েছে! আবার চেষ্টা করুন।");
      setMsgType("error");
    } finally {
      setConverting(false);
    }
  };

  const handleShare = () => {
    const code = referralData?.referralCode;
    if (!code) {
      setConvertMsg("⚠️ Referral code লোড হয়নি, একটু অপেক্ষা করুন।");
      setMsgType("error");
      return;
    }
    const link = `https://playzo-eight.vercel.app?ref=${code}`;
    const text = `আমার referral code: ${code}\n${link}`;
    if (navigator.share) {
      navigator.share({ title: "Playzo তে যোগ দাও!", text: `আমার referral code: ${code}`, url: link });
    } else {
      navigator.clipboard.writeText(text);
      setConvertMsg("✅ লিংক কপি হয়েছে!");
      setMsgType("info");
    }
  };

  // ✅ 20 points minimum (আগে ছিল 100 — ভুল)
  const points     = referralData?.referralPoints || 0;
  const canConvert = points >= 20;
  // ✅ 1 point = 1 টাকা (আগে ছিল Math.floor(points/100)*100 — ভুল)
  const takaAmount = points;

  const msgColors = {
    success: { bg: "#f0fdf4", border: "#bbf7d0", text: "#15803d" },
    error:   { bg: "#fff1f2", border: "#fecdd3", text: "#be123c" },
    info:    { bg: "#eff6ff", border: "#bfdbfe", text: "#1d4ed8" },
  };
  const mc = msgColors[msgType];

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
        <p className="text-4xl mb-2">🎁</p>
        <h2 className="text-xl font-black">Refer & Earn</h2>
        <p className="text-orange-100 text-sm mt-1">বন্ধুদের invite করুন, পয়েন্ট জিতুন!</p>
        <div className="mt-4 bg-white/20 rounded-2xl px-6 py-3 inline-block">
          <p className="text-xs text-orange-100">আপনার Points</p>
          <p className="text-3xl font-black">{points}</p>
          {/* ✅ সঠিক rate */}
          <p className="text-xs text-orange-100 mt-1">১ point = ১ টাকা (min: ২০ pts)</p>
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
          {/* ✅ Share link preview */}
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
            <p className="text-2xl font-black text-green-600">
              {referralData?.referralHistory?.filter(r => r.pointGiven).length || 0}
            </p>
            <p className="text-xs text-gray-500 font-bold">Points পেয়েছি</p>
          </div>
        </div>

        {/* How it works — ✅ সঠিক তথ্য */}
        <div className="bg-gray-50 rounded-2xl p-4">
          <p className="font-black text-sm mb-3">কীভাবে কাজ করে?</p>
          <div className="space-y-2 text-sm">
            {[
              "১. আপনার code দিয়ে বন্ধু register করবে",
              "২. বন্ধু ৳৫০+ deposit করবে",
              "৩. বন্ধু যেকোনো একটি match join করবে",
              "৪. আপনি ৫ পয়েন্ট পাবেন (১ point = ১ টাকা)",
              "৫. মাত্র ২০ points হলেই ৳২০ convert করতে পারবেন",
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

        {/* Progress bar */}
        <div className="bg-gray-50 rounded-2xl p-4">
          <div className="flex justify-between text-xs font-bold text-gray-500 mb-2">
            <span>Progress</span>
            <span>{points} / ২০ pts minimum</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className="bg-orange-500 h-3 rounded-full transition-all duration-500"
              style={{ width: `${Math.min((points / 20) * 100, 100)}%` }}
            />
          </div>
          {canConvert && (
            <p className="text-xs text-green-600 font-bold mt-2">✅ আপনি convert করতে পারবেন! → ৳{takaAmount}</p>
          )}
        </div>

        {/* Message */}
        {convertMsg && (
          <div style={{ background: mc.bg, border: `1px solid ${mc.border}`, color: mc.text, padding: "12px 16px", borderRadius: 14, textAlign: "center", fontSize: 13, fontWeight: 600 }}>
            {convertMsg}
          </div>
        )}

        {/* Convert Button — ✅ সঠিক amount */}
        <button
          onClick={handleConvert}
          disabled={converting || !canConvert}
          className="w-full bg-orange-500 hover:bg-orange-600 text-white py-4 rounded-2xl font-black text-lg disabled:opacity-50 transition active:scale-95"
        >
          {converting
            ? "হচ্ছে..."
            : points < 20
              ? `Convert করুন (${points} pts — কমপক্ষে ২০ লাগবে)`
              : `Convert করুন (${points} pts → ৳${takaAmount})`
          }
        </button>

        {/* Referral History */}
        {referralData?.referralHistory?.length > 0 && (
          <div>
            <p className="font-black text-sm mb-3">Referral History</p>
            <div className="space-y-2">
              {referralData.referralHistory.map((r, i) => (
                <div key={i} className="bg-gray-50 rounded-xl p-3 flex justify-between items-center">
                  <div>
                    <p className="font-medium">{r.name || "Unknown"}</p>
                    <p className="text-xs text-gray-500">{r.phone}</p>
                  </div>
                  <div>
                    {r.pointGiven ? (
                      <span className="bg-green-100 text-green-700 text-xs px-3 py-1 rounded-full font-bold">+5 pts ✅</span>
                    ) : r.deposited ? (
                      <span className="bg-blue-100 text-blue-700 text-xs px-3 py-1 rounded-full font-semibold">Match পেন্ডিং ⏳</span>
                    ) : (
                      <span className="bg-gray-200 text-gray-500 text-xs px-3 py-1 rounded-full">Deposit পেন্ডিং</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default Referral;