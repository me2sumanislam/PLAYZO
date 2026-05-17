 import React, { useState, useEffect } from "react";
import BottomMenu from "../../Component/BottomMenu/BottomMenu";

const Referral = () => {
  const [user, setUser] = useState({});
  const [points, setPoints] = useState(1250); // পরে backend থেকে আনবে
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const savedUser = JSON.parse(localStorage.getItem("user") || "{}");
    setUser(savedUser);
  }, []);

  const referralCode = user?._id?.slice(-8) || "PLAYZO123";
  const referralLink = `https://playzo.app/ref/${referralCode}`;

  const copyLink = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const convertToMoney = () => {
    if (points >= 1000) {
      const amount = Math.floor(points / 10);
      alert(`🎉 ${amount} টাকা সফলভাবে আপনার ওয়ালেটে যোগ হয়েছে!`);
    } else {
      alert("কমপক্ষে ১০০০ পয়েন্ট লাগবে কনভার্ট করতে");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <div className="bg-gradient-to-br from-orange-500 to-pink-600 text-white p-6">
        <h1 className="text-2xl font-bold">Refer & Earn</h1>
        <p className="mt-1 opacity-90">বন্ধু ডেকে আনুন, পয়েন্ট কামান</p>
      </div>

      <div className="p-4 space-y-5">
        <div className="bg-white rounded-2xl p-5 shadow">
          <p className="text-gray-500 text-sm">আপনার রেফারেল কোড</p>
          <div className="flex gap-3 mt-2">
            <div className="bg-gray-100 flex-1 p-4 rounded-xl font-mono text-xl font-bold">
              {referralCode}
            </div>
            <button
              onClick={copyLink}
              className="bg-orange-500 text-white px-6 rounded-xl font-semibold"
            >
              {copied ? "Copied" : "Copy"}
            </button>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow text-center">
          <p className="text-4xl font-bold text-orange-500">{points}</p>
          <p className="text-gray-500">Total Referral Points</p>
          <p className="text-green-600 font-semibold mt-2">
            (১০০০ পয়েন্ট = ১০০ টাকা)
          </p>
        </div>

        <button
          onClick={convertToMoney}
          disabled={points < 1000}
          className={`w-full py-4 text-lg font-bold rounded-2xl ${
            points >= 1000 ? "bg-green-500 text-white" : "bg-gray-300 text-gray-500"
          }`}
        >
          {points >= 1000 ? "Convert to Wallet" : "1000 Points লাগবে"}
        </button>
      </div>

      <BottomMenu tab="referral" setTab={() => {}} />
    </div>
  );
};

export default Referral;