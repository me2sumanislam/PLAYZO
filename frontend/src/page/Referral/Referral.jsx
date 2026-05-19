  import React, { useState, useEffect } from "react";
import axios from "axios";

const API = import.meta.env.VITE_API_URL || "https://playzo-vn8e.onrender.com";

const Referral = ({ onBack, user, token }) => {
  const [referralData, setReferralData] = useState(null);
  const [converting, setConverting] = useState(false);
  const [convertMsg, setConvertMsg] = useState("");

  useEffect(() => {
    fetchReferral();
  }, []);

  const fetchReferral = async () => {
    try {
      const res = await axios.get(`${API}/api/wallet/referral/${user.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.data.success) {
        setReferralData(res.data.data);
      }
    } catch (err) {
      console.error("Referral fetch error:", err);
    }
  };

  const handleConvert = async () => {
    setConverting(true);
    setConvertMsg("");
    try {
      const res = await axios.post(
        `${API}/api/wallet/referral/convert`,
        { userId: user.id },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setConvertMsg(res.data.message || "সফল হয়েছে!");
      if (res.data.success) fetchReferral();
    } catch (err) {
      setConvertMsg("এরর হয়েছে! আবার চেষ্টা করুন।");
    } finally {
      setConverting(false);
    }
  };

  const handleShare = () => {
    const link = `https://playzo-eight.vercel.app?ref=${referralData?.referralCode}`;
    if (navigator.share) {
      navigator.share({
        title: "uthiYO তে যোগ দাও!",
        text: `আমার referral code: ${referralData?.referralCode}`,
        url: link,
      });
    } else {
      navigator.clipboard.writeText(link);
      setConvertMsg("✅ লিংক কপি হয়েছে!");
    }
  };

  return (
    <div className="bg-white min-h-screen pb-10">
      <div className="bg-gradient-to-b from-orange-400 to-orange-600 pt-12 pb-8 text-center text-white px-4 relative">
        <button 
          onClick={onBack} 
          className="absolute left-4 top-12 text-white font-bold text-2xl"
        >
          ←
        </button>
        <p className="text-4xl mb-2">🎁</p>
        <h2 className="text-xl font-black">Refer & Earn</h2>
        <p className="text-orange-100 text-sm mt-1">বন্ধুদের invite করুন, পয়েন্ট জিতুন!</p>

        <div className="mt-4 bg-white/20 rounded-2xl px-6 py-3 inline-block">
          <p className="text-xs text-orange-100">আপনার Points</p>
          <p className="text-3xl font-black">{referralData?.referralPoints || 0}</p>
          <p className="text-xs text-orange-100 mt-1">১০০ points = ৳১০০</p>
        </div>
      </div>

      <div className="px-4 mt-6 space-y-4">
        {/* Referral Code */}
        <div className="bg-orange-50 border border-orange-200 rounded-2xl p-4">
          <p className="text-xs text-gray-500 font-bold mb-1">আপনার Referral Code</p>
          <div className="flex items-center justify-between">
            <p className="text-2xl font-black text-orange-600 tracking-widest">
              {referralData?.referralCode || "লোড হচ্ছে..."}
            </p>
            <button
              onClick={handleShare}
              className="bg-orange-500 text-white px-4 py-2 rounded-xl font-bold text-sm"
            >
              Share 🔗
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-blue-50 rounded-2xl p-4 text-center">
            <p className="text-2xl font-black text-blue-600">{referralData?.referralCount || 0}</p>
            <p className="text-xs text-gray-500 font-bold">মোট Refer</p>
          </div>
          <div className="bg-green-50 rounded-2xl p-4 text-center">
            <p className="text-2xl font-black text-green-600">
              {referralData?.referralHistory?.filter(r => r.deposited).length || 0}
            </p>
            <p className="text-xs text-gray-500 font-bold">Deposit করেছে</p>
          </div>
        </div>

        {/* How it works */}
        <div className="bg-gray-50 rounded-2xl p-4">
          <p className="font-black text-sm mb-3">কীভাবে কাজ করে?</p>
          <div className="space-y-2 text-sm">
            {[
              "১. আপনার code দিয়ে বন্ধু register করবে",
              "২. বন্ধু ৳৫০+ deposit করবে",
              "৩. আপনি ৫ পয়েন্ট পাবেন",
              "৪. ২০ জন = ১০০ পয়েন্ট = ৳১০০",
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

        {/* Convert Button */}
        {convertMsg && (
          <div className="bg-green-50 border border-green-200 text-green-700 p-3 rounded-xl text-center">
            {convertMsg}
          </div>
        )}

        <button
          onClick={handleConvert}
          disabled={converting || (referralData?.referralPoints || 0) < 100}
          className="w-full bg-orange-500 hover:bg-orange-600 text-white py-4 rounded-2xl font-black text-lg disabled:opacity-50 transition"
        >
          {converting ? "হচ্ছে..." : `Convert করুন (${referralData?.referralPoints || 0} pts)`}
        </button>

        {/* History */}
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
                      <span className="bg-blue-100 text-blue-700 text-xs px-3 py-1 rounded-full">Deposited</span>
                    ) : (
                      <span className="bg-gray-200 text-gray-500 text-xs px-3 py-1 rounded-full">Pending</span>
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