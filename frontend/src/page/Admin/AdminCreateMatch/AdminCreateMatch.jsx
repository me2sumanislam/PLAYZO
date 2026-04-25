 import React, { useState } from "react";

const AdminCreateMatch = () => {
  const [form, setForm] = useState({
    title: "",
    category: "solo",
    entryFee: "",
    winPrize: "",
    totalPlayers: "",
    perKill: "",
    roomId: "",
    roomPassword: "",
    startTime: "",
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // ================= CREATE MATCH =================
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const res = await fetch("http://localhost:5000/api/matches/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (data.success || data._id || data.data) {
        alert("Match Created Successfully 🚀");

        setForm({
          title: "",
          category: "solo",
          entryFee: "",
          winPrize: "",
          totalPlayers: "",
          perKill: "",
          roomId: "",
          roomPassword: "",
          startTime: "",
        });
      } else {
        alert("Failed to create match");
      }
    } catch (err) {
      alert("Server Error");
      console.log(err);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex justify-center p-3">
      <div className="w-full max-w-[450px] bg-white rounded-2xl shadow p-4">

        <h2 className="text-center font-bold text-xl text-blue-600 mb-4">
          CREATE MATCH (ADMIN)
        </h2>

        <form onSubmit={handleSubmit} className="space-y-3">

          {/* TITLE */}
          <input
            name="title"
            value={form.title}
            onChange={handleChange}
            placeholder="Match Title"
            className="w-full p-3 border rounded-xl"
            required
          />

          {/* CATEGORY */}
          <select
            name="category"
            value={form.category}
            onChange={handleChange}
            className="w-full p-3 border rounded-xl"
          >
            <option value="solo">SOLO</option>
            <option value="duo">DUO</option>
            <option value="squad">SQUAD</option>
            <option value="cs">CS</option>
            <option value="custom">CUSTOM</option>
            <option value="tournament">TOURNAMENT</option>
          </select>

          {/* ENTRY FEE */}
          <input
            name="entryFee"
            value={form.entryFee}
            onChange={handleChange}
            placeholder="Entry Fee"
            type="number"
            className="w-full p-3 border rounded-xl"
          />

          {/* WIN PRIZE */}
          <input
            name="winPrize"
            value={form.winPrize}
            onChange={handleChange}
            placeholder="Win Prize"
            type="number"
            className="w-full p-3 border rounded-xl"
          />

          {/* PER KILL */}
          <input
            name="perKill"
            value={form.perKill}
            onChange={handleChange}
            placeholder="Per Kill"
            type="number"
            className="w-full p-3 border rounded-xl"
          />

          {/* TOTAL PLAYERS */}
          <input
            name="totalPlayers"
            value={form.totalPlayers}
            onChange={handleChange}
            placeholder="Total Players"
            type="number"
            className="w-full p-3 border rounded-xl"
          />

          {/* ROOM ID */}
          <input
            name="roomId"
            value={form.roomId}
            onChange={handleChange}
            placeholder="Room ID (optional now)"
            className="w-full p-3 border rounded-xl"
          />

          {/* PASSWORD */}
          <input
            name="roomPassword"
            value={form.roomPassword}
            onChange={handleChange}
            placeholder="Room Password (optional now)"
            className="w-full p-3 border rounded-xl"
          />

          {/* START TIME */}
          <input
            name="startTime"
            value={form.startTime}
            onChange={handleChange}
            type="datetime-local"
            className="w-full p-3 border rounded-xl"
          />

          {/* BUTTON */}
          <button
            type="submit"
            className="w-full bg-green-600 text-white p-3 rounded-xl font-bold active:scale-95"
          >
            CREATE MATCH
          </button>

        </form>
      </div>
    </div>
  );
};

export default AdminCreateMatch;