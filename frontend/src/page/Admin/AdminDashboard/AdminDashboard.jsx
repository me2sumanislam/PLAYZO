 import React, { useState } from "react";

const AdminDashboard = ({ onBack }) => {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("solo");
  const [winPrize, setWinPrize] = useState("");
  const [entryFee, setEntryFee] = useState("");

  const [matches, setMatches] = useState([]);

  // CREATE MATCH
  const handleCreate = () => {
    if (!title || !winPrize || !entryFee) {
      alert("সব ফিল্ড পূরণ করুন");
      return;
    }

    const newMatch = {
      id: Date.now(),
      title,
      category,
      winPrize: Number(winPrize),
      entryFee: Number(entryFee),
    };

    setMatches([newMatch, ...matches]);

    setTitle("");
    setWinPrize("");
    setEntryFee("");

    alert("Match created successfully");
  };

  return (
    <div className="min-h-screen bg-gray-100 max-w-[450px] mx-auto pb-20">

      {/* HEADER */}
      <div className="bg-white p-4 flex items-center gap-3 shadow">
        <button onClick={onBack}>←</button>
        <h2 className="font-bold">Admin Panel</h2>
      </div>

      {/* FORM */}
      <div className="p-3 space-y-3">

        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Match Title"
          className="w-full p-3 rounded-lg border bg-white"
        />

        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="w-full p-3 rounded-lg border bg-white"
        >
          <option value="solo">Solo</option>
          <option value="duo">Duo</option>
          <option value="squad">Squad</option>
          <option value="cs">CS</option>
        </select>

        <input
          value={winPrize}
          onChange={(e) => setWinPrize(e.target.value)}
          placeholder="Win Prize"
          type="number"
          className="w-full p-3 rounded-lg border bg-white"
        />

        <input
          value={entryFee}
          onChange={(e) => setEntryFee(e.target.value)}
          placeholder="Entry Fee"
          type="number"
          className="w-full p-3 rounded-lg border bg-white"
        />

        <button
          onClick={handleCreate}
          className="w-full bg-green-500 text-white p-3 rounded-lg font-bold"
        >
          CREATE MATCH
        </button>
      </div>

      {/* LIST */}
      <div className="p-3 space-y-2">
        {matches.map((m) => (
          <div key={m.id} className="bg-white p-3 rounded-lg shadow">
            <h3 className="font-bold">{m.title}</h3>
            <p className="text-xs text-gray-500">
              {m.category} | Win ৳{m.winPrize} | Entry ৳{m.entryFee}
            </p>
          </div>
        ))}
      </div>

    </div>
  );
};

export default AdminDashboard;