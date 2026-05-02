 import React, { useState, useEffect } from "react";
import BottomMenu from "../BottomMenu/BottomMenu";
import Profile from "../../page/Profile/profile";
import Wallet from "../../page/Wallet/Wallet";
import MatchList from "../../page/MatchList/MatchList";
import MatchJoin from "../../page/MatchJoin/MatchJoin";
import Withdraw from "../../page/Withdraw/Withdraw";
import AllRulesPage from "../AllRulesPage/AllRulesPage"; // ✅ নতুন

const AppDashboard = ({ onLogout }) => {
  const [tab, setTab] = useState("play");
  const [screen, setScreen] = useState("home");
  const [slide, setSlide] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [matches, setMatches] = useState([]);

  useEffect(() => {
    const loadMatches = async () => {
      try {
        const res = await fetch("http://localhost:5000/api/matches");
        const data = await res.json();
        let safeData = [];
        if (Array.isArray(data)) safeData = data;
        else if (Array.isArray(data?.matches)) safeData = data.matches;
        else if (Array.isArray(data?.data)) safeData = data.data;
        setMatches(safeData);
      } catch (err) {
        console.log("MATCH LOAD ERROR:", err);
        setMatches([]);
      }
    };
    loadMatches();
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setSlide((p) => (p === 2 ? 0 : p + 1));
    }, 3000);
    return () => clearInterval(timer);
  }, []);

  const categories = [
    { key: "solo",       title: "SOLO",       img: "/image/img-1.jpg" },
    { key: "duo",        title: "DUO",        img: "/image/img-2.jpg" },
    { key: "squad",      title: "SQUAD",      img: "/image/img-3.jpg" },
    { key: "cs",         title: "CS",         img: "/image/img-1.jpg" },
    { key: "custom",     title: "CUSTOM",     img: "/image/img-2.jpg" },
    { key: "tournament", title: "TOURNAMENT", img: "/image/img-3.jpg" },
  ];

  const filteredMatches = matches.filter(
    (m) =>
      (m.category || "").toLowerCase().trim() ===
      selectedCategory.toLowerCase().trim()
  );

  // --- PROFILE TAB ---
  if (tab === "profile") {

    if (screen === "wallet") {
      return (
        <div className="bg-white min-h-screen max-w-[450px] mx-auto pb-24">
          <Wallet onBack={() => setScreen("home")} />
          <BottomMenu tab={tab} setTab={setTab} />
        </div>
      );
    }

    if (screen === "withdraw") {
      return (
        <div className="bg-white min-h-screen max-w-[450px] mx-auto pb-24 shadow-xl">
          <Withdraw onBack={() => setScreen("home")} />
          <BottomMenu tab={tab} setTab={setTab} />
        </div>
      );
    }

    // ✅ নতুন
    if (screen === "all_rules") {
      return (
        <div className="bg-white min-h-screen max-w-[450px] mx-auto">
          <AllRulesPage onBack={() => setScreen("home")} />
        </div>
      );
    }

    return (
      <div className="bg-white min-h-screen max-w-[450px] mx-auto pb-24">
        <Profile
          onLogout={onLogout}
          onWallet={() => setScreen("wallet")}
          onWithdraw={() => setScreen("withdraw")}
          onAllRules={() => setScreen("all_rules")} // ✅ নতুন
        />
        <BottomMenu tab={tab} setTab={setTab} />
      </div>
    );
  }

  // --- OTHER TABS ---
  if (tab === "shop") {
    return (
      <div className="bg-white min-h-screen max-w-[450px] mx-auto pb-24">
        <div className="p-4 text-center text-gray-400 mt-20 text-lg font-bold">
          🛒 Shop Coming Soon...
        </div>
        <BottomMenu tab={tab} setTab={setTab} />
      </div>
    );
  }

  if (tab === "matches") {
    return (
      <div className="bg-white min-h-screen max-w-[450px] mx-auto pb-24">
        <div className="p-4 text-center text-gray-400 mt-20 text-lg font-bold">
          📋 My Matches Coming Soon...
        </div>
        <BottomMenu tab={tab} setTab={setTab} />
      </div>
    );
  }

  if (tab === "results") {
    return (
      <div className="bg-white min-h-screen max-w-[450px] mx-auto pb-24">
        <div className="p-4 text-center text-gray-400 mt-20 text-lg font-bold">
          📊 Results Coming Soon...
        </div>
        <BottomMenu tab={tab} setTab={setTab} />
      </div>
    );
  }

  // --- MATCH SCREENS ---
  if (screen === "join") {
    return (
      <MatchJoin
        match={selectedMatch}
        onBack={() => setScreen("category")}
      />
    );
  }

  if (screen === "category") {
    return (
      <div className="max-w-[450px] mx-auto min-h-screen bg-white">
        <MatchList
          matches={filteredMatches}
          title={selectedCategory}
          onBack={() => setScreen("home")}
          onSelectMatch={(match) => {
            setSelectedMatch(match);
            setScreen("join");
          }}
        />
        <BottomMenu tab={tab} setTab={setTab} />
      </div>
    );
  }

  // --- HOME SCREEN ---
  return (
    <div className="bg-gray-50 min-h-screen max-w-[450px] mx-auto pb-24">
      <div className="p-4">
        <div className="relative w-full h-44 overflow-hidden rounded-3xl shadow-lg border-4 border-white">
          {categories.slice(0, 3).map((c, i) => (
            <img
              key={i}
              src={c.img}
              className="absolute w-full h-full object-cover transition-opacity duration-1000"
              style={{ opacity: slide === i ? 1 : 0 }}
              alt="Slider"
            />
          ))}
          <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className={`h-1.5 rounded-full transition-all ${
                  slide === i ? "w-6 bg-white" : "w-1.5 bg-white/50"
                }`}
              />
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between mt-6 px-1">
          <h2 className="font-black text-gray-800 text-lg tracking-tight uppercase">
            Free Fire <span className="text-orange-500">Arena</span>
          </h2>
          <span className="text-[10px] bg-orange-100 text-orange-600 px-2 py-1 rounded-md font-bold animate-pulse">
            LIVE NOW
          </span>
        </div>

        <div className="grid grid-cols-2 gap-4 mt-4">
          {categories.map((c) => {
            const count = matches.filter(
              (m) => (m.category || "").toLowerCase().trim() === c.key
            ).length;

            return (
              <div
                key={c.key}
                onClick={() => {
                  setSelectedCategory(c.key);
                  setScreen("category");
                }}
                className="bg-white rounded-2xl shadow-sm border border-gray-100 p-2.5 cursor-pointer active:scale-95 transition hover:shadow-md"
              >
                <div className="relative">
                  <img
                    src={c.img}
                    className="h-28 w-full object-cover rounded-xl"
                    alt={c.title}
                  />
                  {count > 0 && (
                    <span className="absolute top-2 right-2 bg-green-500 text-white text-[9px] px-2 py-0.5 rounded-full font-bold">
                      {count}
                    </span>
                  )}
                </div>
                <div className="mt-2 ml-1">
                  <p className="text-xs font-black text-gray-800 uppercase tracking-wide">
                    {c.title}
                  </p>
                  <p className="text-[10px] text-gray-400 font-medium">Join Tournament</p>
                </div>
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