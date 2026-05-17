 import React, { useState, useEffect } from "react";
import axios from "axios";
import AddMoneyModal from "../../Component/Addmoney/AddMoney";
import Withdraw from "../../page/Withdraw/Withdraw";
import BuildYourApp from "../../page/BuildYourApp/BuildYourApp";

const API = import.meta.env.VITE_API_URL || "https://playzo-vn8e.onrender.com";

const Profile = ({ onLogout, onAllRules, onMyProfile }) => {
  const [showAddMoney, setShowAddMoney]   = useState(false);
  const [showWithdraw, setShowWithdraw]   = useState(false);
  const [showBuildApp, setShowBuildApp]   = useState(false);
  const [showReferral, setShowReferral]   = useState(false); // ✅ NEW
  const [balance, setBalance]             = useState(0);
  const [referralData, setReferralData]   = useState(null); // ✅ NEW
  const [converting, setConverting]       = useState(false); // ✅ NEW
  const [convertMsg, setConvertMsg]       = useState("");    // ✅ NEW

  const user  = JSON.parse(localStorage.getItem("user") || "{}");
  const token = localStorage.getItem("token");

  const fetchBalance = async () => {
    try {
      const res = await axios.get(`${API}/api/users/balance`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setBalance(res.data.balance || 0);
    } catch (err) {
      console.error(err);
    }
  };

  // ✅ Referral data fetch
  const fetchReferral = async () => {
    try {
      const res = await axios.get(`${API}/api/wallet/referral/${user.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.data.success) setReferralData(res.data.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    let cancelled = false;
    const getBalance = async () => {
      try {
        const res = await axios.get(`${API}/api/users/balance`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!cancelled) setBalance(res.data.balance || 0);
      } catch (err) {
        console.error(err);
      }
    };
    getBalance();
    const interval = setInterval(getBalance, 5000);
    return () => { cancelled = true; clearInterval(interval); };
  }, []);

  // ✅ Points convert
  const handleConvert = async () => {
    setConverting(true);
    setConvertMsg("");
    try {
      const res = await axios.post(`${API}/api/wallet/referral/convert`,
        { userId: user.id },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setConvertMsg(res.data.message);
      if (res.data.success) {
        fetchBalance();
        fetchReferral();
      }
    } catch (err) {
      setConvertMsg("Error! আবার চেষ্টা করুন।");
    }
    setConverting(false);
  };

  // ✅ Share referral link
  const handleShare = () => {
    const link = `https://playzo-eight.vercel.app?ref=${referralData?.referralCode}`;
    if (navigator.share) {
      navigator.share({ title: "uthiYO তে যোগ দাও!", text: `আমার referral code: ${referralData?.referralCode}`, url: link });
    } else {
      navigator.clipboard.writeText(link);
      setConvertMsg("✅ Link copied!");
    }
  };

  const menuItems = [
    { id: "wallet",      label: "Wallet / Add Money", icon: "👛" },
    { id: "withdraw",    label: "Withdraw",            icon: "💵" },
    { id: "referral",    label: "Refer & Earn",        icon: "🎁" }, // ✅ NEW
    { id: "my_profile",  label: "Account Info",        icon: "👤" },
    { id: "all_rules",   label: "All Rules",           icon: "📋" },
    { id: "top_players", label: "Top Players",         icon: "📈" },
    { id: "dev_profile", label: "Build Your App",      icon: "🚀" },
  ];

  const handleNavigate = (id) => {
    if (id === "wallet")      setShowAddMoney(true);
    if (id === "withdraw")    setShowWithdraw(true);
    if (id === "all_rules")   onAllRules();
    if (id === "my_profile")  onMyProfile();
    if (id === "dev_profile") setShowBuildApp(true);
    if (id === "referral")  { fetchReferral(); setShowReferral(true); } // ✅ NEW
  };

  if (showBuildApp) return <BuildYourApp onBack={() => setShowBuildApp(false)} />;

  // ✅ REFERRAL PAGE
  if (showReferral) return (
    <div className="bg-white min-h-screen pb-10">
      <div className="bg-gradient-to-b from-orange-400 to-orange-600 pt-12 pb-8 text-center text-white px-4">
        <button onClick={() => { setShowReferral(false); setConvertMsg(""); }} className="absolute left-4 top-12 text-white font-bold text-lg">←</button>
        <p className="text-4xl mb-2">🎁</p>
        <h2 className="text-xl font-black">Refer & Earn</h2>
        <p className="text-orange-100 text-sm mt-1">বন্ধুদের invite করুন, পয়েন্ট জিতুন!</p>

        <div className="mt-4 bg-white/20 rounded-2xl px-6 py-3 inline-block">
          <p className="text-xs text-orange-100">আপনার Points</p>
          <p className="text-3xl font-black">{referralData?.referralPoints || 0}</p>
          <p className="text-xs text-orange-100 mt-1">100 points = ৳100</p>
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
          <div className="space-y-2">
            {[
              { step: "১", text: "আপনার code দিয়ে বন্ধু register করবে" },
              { step: "২", text: "বন্ধু ৳50+ deposit করবে" },
              { step: "৩", text: "আপনি 5 points পাবেন" },
              { step: "৪", text: "20 জন = 100 points = ৳100 balance" },
            ].map(item => (
              <div key={item.step} className="flex gap-3 items-center">
                <span className="w-7 h-7 bg-orange-500 text-white rounded-full flex items-center justify-center text-xs font-black flex-shrink-0">
                  {item.step}
                </span>
                <p className="text-sm text-gray-600">{item.text}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Convert Button */}
        {convertMsg && (
          <div className="bg-green-50 border border-green-200 text-green-700 text-sm font-bold text-center p-3 rounded-xl">
            {convertMsg}
          </div>
        )}

        <button
          onClick={handleConvert}
          disabled={converting || (referralData?.referralPoints || 0) < 100}
          className="w-full bg-orange-500 text-white py-4 rounded-2xl font-black text-lg disabled:opacity-40 active:scale-95 transition"
        >
          {converting ? "হচ্ছে..." : `Convert করুন (${referralData?.referralPoints || 0} pts)`}
        </button>

        {(referralData?.referralPoints || 0) < 100 && (
          <p className="text-center text-xs text-gray-400">
            আরো {100 - (referralData?.referralPoints || 0)} points লাগবে
          </p>
        )}

        {/* Referral History */}
        {referralData?.referralHistory?.length > 0 && (
          <div>
            <p className="font-black text-sm mb-3">Referral History</p>
            <div className="space-y-2">
              {referralData.referralHistory.map((r, i) => (
                <div key={i} className="flex justify-between items-center bg-gray-50 rounded-xl p-3">
                  <div>
                    <p className="font-bold text-sm">{r.name || "User"}</p>
                    <p className="text-xs text-gray-400">{r.phone}</p>
                  </div>
                  <div className="text-right">
                    {r.pointGiven ? (
                      <span className="bg-green-100 text-green-600 text-xs font-bold px-2 py-1 rounded-full">+5 pts ✅</span>
                    ) : r.deposited ? (
                      <span className="bg-blue-100 text-blue-600 text-xs font-bold px-2 py-1 rounded-full">Deposited</span>
                    ) : (
                      <span className="bg-gray-100 text-gray-400 text-xs font-bold px-2 py-1 rounded-full">Pending</span>
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

  return (
    <div className="bg-white min-h-screen pb-10">
      <div className="bg-gradient-to-b from-[#56CCF2] to-[#2F80ED] pt-12 pb-8 text-center text-white">
        <div className="w-20 h-20 bg-yellow-400 rounded-full mx-auto mb-3 flex items-center justify-center text-4xl">
          👨‍💻
        </div>
        <h2 className="text-xl font-bold">{user?.name || "User"}</h2>
        <p className="text-blue-100 text-sm mt-1">{user?.phone || ""}</p>
        <div className="mt-4 bg-white/20 rounded-2xl px-6 py-3 inline-block">
          <p className="text-xs text-blue-100">ব্যালেন্স</p>
          <p className="text-2xl font-black">৳ {balance.toLocaleString()}</p>
        </div>
      </div>

      <div className="mt-4 px-2">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => handleNavigate(item.id)}
            className="w-full flex justify-between items-center p-4 border-b hover:bg-gray-50 transition"
          >
            <div className="flex gap-4 items-center">
              <span className="text-xl">{item.icon}</span>
              <span className="font-bold text-sm">{item.label}</span>
            </div>
            <span className="text-gray-400">›</span>
          </button>
        ))}
      </div>

      <div className="px-8 mt-12">
        <button
          onClick={onLogout}
          className="w-full bg-blue-500 text-white py-3 rounded-full font-bold"
        >
          Logout
        </button>
      </div>

      <AddMoneyModal
        isOpen={showAddMoney}
        onClose={() => { setShowAddMoney(false); fetchBalance(); }}
      />
      <Withdraw
        isOpen={showWithdraw}
        onClose={() => { setShowWithdraw(false); fetchBalance(); }}
      />
    </div>
  );
};

export default Profile;