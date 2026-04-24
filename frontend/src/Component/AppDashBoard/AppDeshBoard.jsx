 import React, { useState, useEffect } from "react";
import BottomMenu from "../BottomMenu/BottomMenu";
import Profile from "../../page/Profile/profile";
import Wallet from "../../page/Wallet/Wallet";
import MatchList from "../../page/MatchList/MatchList";
import MatchJoin from "../../page/MatchJoin/MatachJoin";

const AppDashboard = ({ onLogout }) => {
  const [tab, setTab] = useState("play");
  const [screen, setScreen] = useState("home");
  const [slide, setSlide] = useState(0);

  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedMatch, setSelectedMatch] = useState(null);

  const [matches, setMatches] = useState([]);

  // ================= BACKEND FETCH =================
  useEffect(() => {
    const loadMatches = async () => {
      try {
        const res = await fetch("/api/matches");
        const data = await res.json();
        setMatches(data);
      } catch (err) {
        setMatches([]);
      }
    };

    loadMatches();
  }, []);

  // ================= SLIDER =================
  useEffect(() => {
    const timer = setInterval(() => {
      setSlide((p) => (p === 9 ? 0 : p + 1));
    }, 3000);

    return () => clearInterval(timer);
  }, []);

  // ================= CATEGORY =================
  const categories = [
    { key: "solo", title: "SOLO", img: "/image/img-1.jpg" },
    { key: "duo", title: "DUO", img: "/image/img-2.jpg" },
    { key: "squad", title: "SQUAD", img: "/image/img-3.jpg" },
    { key: "cs", title: "CS", img: "/image/img-1.jpg" },
    { key: "custom", title: "CUSTOM", img: "/image/img-2.jpg" },
    { key: "tournament", title: "TOURNAMENT", img: "/image/img-3.jpg" },
  ];

  // ================= WALLET SCREEN =================
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
            if (id === "my_profile") setScreen("profile");
          }}
        />
        <BottomMenu tab={tab} setTab={setTab} />
      </div>
    );
  }

  // ================= MATCH JOIN =================
  if (screen === "join") {
    return (
      <MatchJoin
        match={selectedMatch}
        onBack={() => setScreen("category")}
      />
    );
  }

  // ================= MATCH LIST =================
  if (screen === "category") {
    const filtered = matches.filter(
      (m) => m.category === selectedCategory
    );

    return (
      <div className="max-w-[450px] mx-auto">
        <MatchList
          matches={filtered}
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

  // ================= HOME =================
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

        {/* CATEGORY GRID */}
        <div className="grid grid-cols-2 gap-3 mt-4">

          {categories.map((c) => {
            const count = matches.filter(
              (m) => m.category === c.key
            ).length;

            return (
              <div
                key={c.key}
                onClick={() => {
                  setSelectedCategory(c.key);
                  setScreen("category");
                }}
                className="bg-white rounded-xl shadow p-2 cursor-pointer active:scale-95 transition"
              >
                <img
                  src={c.img}
                  className="h-24 w-full object-cover rounded-lg"
                />
                <p className="text-xs font-bold mt-1 uppercase">
                  {c.title}
                </p>
                <p className="text-[11px] text-gray-500">
                  {count} Matches
                </p>
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