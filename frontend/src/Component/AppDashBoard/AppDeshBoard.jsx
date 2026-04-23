 import React, { useState, useEffect } from "react";
 
import AdminDashboard from "../../page/Admin/AdminDashboard/AdminDashboard";

// ================= NAVBAR =================
const BottomNav = ({ setView }) => {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-[#111827] text-white flex justify-around p-3 border-t border-white/10">
      <button onClick={() => setView("home")}>🏠 Home</button>
      <button onClick={() => setView("match")}>🎮 Match</button>
      <button onClick={() => setView("results")}>📊 Results</button>
      <button onClick={() => setView("profile")}>👤 Profile</button>
    </div>
  );
};

// ================= PRIZE MODAL =================
const PrizeModal = ({ isOpen, onClose, match }) => {
  if (!isOpen || !match) return null;

  const list = [
    { l: "Winner", v: match.prize1 },
    { l: "2nd", v: match.prize2 },
    { l: "3rd", v: match.prize3 },
    { l: "Per Kill", v: match.perKill },
  ];

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
      <div className="bg-[#141b2d] text-white p-4 rounded-2xl w-[300px]">
        <h2 className="font-bold text-center mb-3">{match.title}</h2>

        {list.map((i, idx) => (
          <div key={idx} className="flex justify-between text-sm py-1">
            <span>{i.l}</span>
            <span className="text-yellow-400">{i.v || 0} TK</span>
          </div>
        ))}

        <button
          onClick={onClose}
          className="w-full mt-3 bg-red-500 py-2 rounded-xl"
        >
          Close
        </button>
      </div>
    </div>
  );
};

// ================= CATEGORY CARD =================
const CategoryCard = ({ cat, onClick }) => {
  return (
    <div
      onClick={() => onClick(cat)}
      className="bg-gradient-to-br from-[#1c2333] to-[#0b0f1a] border border-white/10 rounded-2xl p-3 cursor-pointer"
    >
      <img
        src={cat.image}
        alt=""
        className="w-full h-24 object-cover rounded-xl"
      />

      <h3 className="text-white font-bold mt-2">{cat.name}</h3>

      <p className="text-xs text-gray-400">
        Matches: {cat.matches?.length || 0}
      </p>
    </div>
  );
};

// ================= MAIN =================
const AppDashboard = () => {
  const [view, setView] = useState("home");
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selMatch, setSelMatch] = useState(null);

  const [categories, setCategories] = useState([]);

  // 🔥 LOAD FROM BACKEND
  useEffect(() => {
    fetch("http://localhost:5000/api/categories")
      .then((res) => res.json())
      .then((data) => {
        setCategories(data.data || []);
      })
      .catch((err) => console.log(err));
  }, []);

  // ================= ADMIN =================
  if (view === "admin") {
    return <AdminDashboard onBack={() => setView("home")} />;
  }

  // ================= CATEGORY HOME =================
  const renderHome = () => (
    <div className="bg-[#0b0f1a] min-h-screen text-white p-3 pb-20">
      <div className="flex justify-end mb-3">
        <button onClick={() => setView("admin")}>⚙️</button>
      </div>

      <h2 className="font-bold mb-3">🎮 Game Categories</h2>

      <div className="grid grid-cols-2 gap-3">
        {categories.map((cat) => (
          <CategoryCard
            key={cat._id}
            cat={cat}
            onClick={setSelectedCategory}
          />
        ))}
      </div>

      <BottomNav setView={setView} />
    </div>
  );

  // ================= MATCH LIST =================
  const renderMatches = () => (
    <div className="bg-[#0b0f1a] min-h-screen p-3 text-white pb-20">
      <PrizeModal
        isOpen={!!selMatch}
        onClose={() => setSelMatch(null)}
        match={selMatch}
      />

      <button
        onClick={() => setSelectedCategory(null)}
        className="mb-3 text-sm"
      >
        ← Back
      </button>

      <h2 className="font-bold mb-3">{selectedCategory?.name}</h2>

      {selectedCategory?.matches?.map((m, i) => (
        <div
          key={i}
          className="bg-[#141b2d] border border-white/10 rounded-xl p-3 mb-3"
        >
          <h3 className="font-bold">{m.title}</h3>
          <p className="text-xs text-gray-400">{m.time}</p>

          <div className="flex gap-2 mt-2">
            <button className="border px-3 py-1 text-xs rounded-lg">
              Room
            </button>

            <button
              onClick={() => setSelMatch(m)}
              className="bg-purple-600 px-3 py-1 text-xs rounded-lg"
            >
              Prize
            </button>

            <button
              className={`px-3 py-1 text-xs rounded-lg ${
                m.joined >= m.totalSlots ? "bg-red-500" : "bg-green-500"
              }`}
            >
              {m.joined >= m.totalSlots ? "FULL" : "JOIN"}
            </button>
          </div>
        </div>
      ))}

      <BottomNav setView={setView} />
    </div>
  );

  // ================= ROUTING =================
  if (selectedCategory) return renderMatches();

  return renderHome();
};

export default AppDashboard;