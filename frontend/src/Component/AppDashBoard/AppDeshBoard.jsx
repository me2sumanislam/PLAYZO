 import React, { useState, useEffect } from "react";
import BottomMenu from "../BottomMenu/BottomMenu";
import Profile from "../../page/Profile/profile";
import Wallet from "../../page/Wallet/Wallet";

const AppDashboard = ({ onLogout }) => {
  const [tab, setTab] = useState("play");
  const [screen, setScreen] = useState("home");
  const [slide, setSlide] = useState(0);
  const [matches, setMatches] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);

  // ================= LOAD MATCHES =================
  useEffect(() => {
    const loadData = async () => {
      try {
        const res = await fetch("/api/matches");
        const data = await res.json();
        setMatches(data);
      } catch (err) {
        const local = localStorage.getItem("matches");
        setMatches(local ? JSON.parse(local) : []);
      }
    };

    loadData();
  }, []);

  // ================= SLIDER =================
  useEffect(() => {
    const t = setInterval(() => {
      setSlide((p) => (p === 9 ? 0 : p + 1));
    }, 3000);

    return () => clearInterval(t);
  }, []);

  const categories = [
    { key: "solo", title: "SOLO MATCH", img: "/image/img-1.jpg" },
    { key: "duo", title: "DUO MATCH", img: "/image/img-2.jpg" },
    { key: "squad", title: "SQUAD MATCH", img: "/image/img-3.jpg" },
    { key: "cs", title: "CS MATCH", img: "/image/img-1.jpg" },
    { key: "custom", title: "CUSTOM", img: "/image/img-2.jpg" },
    { key: "tournament", title: "TOURNAMENT", img: "/image/img-3.jpg" },
  ];

  // ================= WALLET =================
  if (screen === "wallet") {
    return (
      <div className="bg-white min-h-screen max-w-[450px] mx-auto pb-24">
        <Wallet onBack={() => setScreen("profile")} />
        <BottomMenu tab={tab} setTab={setTab} />
      </div>
    );
  }

  // ================= PROFILE =================
  if (tab === "profile") {
    return (
      <div className="bg-white min-h-screen max-w-[450px] mx-auto pb-24">
        <Profile
          onLogout={onLogout}
          onNavigate={(id) => {
            if (id === "wallet") setScreen("wallet");
          }}
        />
        <BottomMenu tab={tab} setTab={setTab} />
      </div>
    );
  }

  // ================= CATEGORY =================
  if (screen === "category") {
    const filtered = matches.filter(
      (m) => m.category === selectedCategory
    );

    return (
      <div className="bg-gray-100 min-h-screen max-w-[450px] mx-auto pb-24">

        <div className="bg-white p-4 flex items-center gap-3 shadow">
          <button onClick={() => setScreen("home")}>←</button>
          <h2 className="font-bold uppercase">{selectedCategory}</h2>
        </div>

        <div className="p-3 space-y-3">
          {filtered.length === 0 ? (
            <div className="bg-white p-4 rounded-xl text-center text-gray-400">
              No Match Available
            </div>
          ) : (
            filtered.map((m, i) => (
              <div key={i} className="bg-white p-4 rounded-xl shadow">
                <h3 className="font-bold">{m.title}</h3>
                <div className="flex justify-between text-xs mt-2">
                  <span>৳{m.winPrize}</span>
                  <span>Entry ৳{m.entryFee}</span>
                </div>
              </div>
            ))
          )}
        </div>

        <BottomMenu tab={tab} setTab={setTab} />
      </div>
    );
  }

  // ================= HOME (NO UI CHANGE) =================
  return (
    <div className="bg-gray-100 min-h-screen max-w-[450px] mx-auto pb-24">

      <div className="p-4">

        {/* SLIDER */}
        <div className="relative w-full h-44 overflow-hidden rounded-2xl">
          {Array.from({ length: 10 }).map((_, i) => (
            <img
              key={i}
              src={`/image/img-${(i % 3) + 1}.jpg`}
              className="absolute w-full h-full object-cover transition-opacity duration-1000"
              style={{ opacity: slide === i ? 1 : 0 }}
              alt=""
            />
          ))}
        </div>

        <h2 className="text-center font-black text-orange-500 mt-3">
          FREE FIRE
        </h2>

        {/* CATEGORY CARDS */}
        <div className="grid grid-cols-2 gap-3 mt-4">
          {categories.map((c) => {
            const count = matches.filter(m => m.category === c.key).length;

            return (
              <div
                key={c.key}
                onClick={() => {
                  setSelectedCategory(c.key);
                  setScreen("category");
                }}
                className="bg-white rounded-xl shadow p-2 cursor-pointer"
              >
                <img src={c.img} className="h-24 w-full object-cover rounded-lg" />
                <p className="text-xs font-bold">{c.title}</p>
                <p className="text-[11px] text-gray-500">{count} Matches</p>
              </div>
            );
          })}
        </div>

      </div>

      <BottomMenu tab={tab} setTab={setTab} />
    </div>
  );
};

export default AppDashboard;