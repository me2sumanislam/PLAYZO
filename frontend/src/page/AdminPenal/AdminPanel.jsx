 import React, { useEffect, useState } from "react";

const AdminPanel = () => {
  const [matches, setMatches] = useState([]);

  const [form, setForm] = useState({
    title: "",
    category: "solo",
    entryFee: "",
    winPrize: "",
    totalPlayers: "",
    startTime: "", // 🔥 FIX ADDED
  });

  const [roomData, setRoomData] = useState({});

  // ================= LOAD MATCHES =================
  const loadMatches = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/matches");

      if (!res.ok) throw new Error("API error");

      const data = await res.json();

      setMatches(Array.isArray(data) ? data : []);
    } catch (err) {
      console.log("LOAD ERROR:", err);
      setMatches([]);
    }
  };

  useEffect(() => {
    loadMatches();
  }, []);

  // ================= CREATE MATCH =================
  const createMatch = async (e) => {
    e.preventDefault();

    const token = localStorage.getItem("token");

    try {
      const res = await fetch("http://localhost:5000/api/matches/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (data.success) {
        alert("Match Created 🎮");

        setForm({
          title: "",
          category: "solo",
          entryFee: "",
          winPrize: "",
          totalPlayers: "",
          startTime: "",
        });

        loadMatches();
      } else {
        alert(data.message || "Failed to create match");
      }
    } catch (err) {
      console.log(err);
    }
  };

  // ================= UPDATE ROOM =================
  const updateRoom = async (id) => {
    try {
      const res = await fetch(
        `http://localhost:5000/api/matches/update-room/${id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(roomData[id] || {}),
        }
      );

      const data = await res.json();

      if (data.success) {
        alert("Room Updated 🔥");
        loadMatches();
      } else {
        alert(data.message || "Update failed");
      }
    } catch (err) {
      console.log(err);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4 max-w-[500px] mx-auto">

      {/* HEADER */}
      <h1 className="text-2xl font-black text-center mb-4">
        🎮 ADMIN PANEL
      </h1>

      {/* CREATE MATCH */}
      <div className="bg-white p-4 rounded-xl shadow mb-4">
        <h2 className="font-bold mb-2">Create Match</h2>

        <form onSubmit={createMatch} className="space-y-2">

          <input
            placeholder="Title"
            className="w-full p-2 border rounded"
            value={form.title}
            onChange={(e) =>
              setForm({ ...form, title: e.target.value })
            }
          />

          <select
            className="w-full p-2 border rounded"
            value={form.category}
            onChange={(e) =>
              setForm({ ...form, category: e.target.value })
            }
          >
            <option value="solo">Solo</option>
            <option value="duo">Duo</option>
            <option value="squad">Squad</option>
            <option value="cs">CS</option>
            <option value="tournament">Tournament</option>
          </select>

          {/* 🔥 START TIME FIX */}
          <input
            type="datetime-local"
            className="w-full p-2 border rounded"
            value={form.startTime}
            onChange={(e) =>
              setForm({ ...form, startTime: e.target.value })
            }
          />

          <input
            placeholder="Entry Fee"
            className="w-full p-2 border rounded"
            onChange={(e) =>
              setForm({ ...form, entryFee: e.target.value })
            }
          />

          <input
            placeholder="Win Prize"
            className="w-full p-2 border rounded"
            onChange={(e) =>
              setForm({ ...form, winPrize: e.target.value })
            }
          />

          <input
            placeholder="Total Players"
            className="w-full p-2 border rounded"
            onChange={(e) =>
              setForm({ ...form, totalPlayers: e.target.value })
            }
          />

          <button className="w-full bg-black text-white p-2 rounded">
            Create Match
          </button>
        </form>
      </div>

      {/* MATCH LIST */}
      <div className="space-y-3">

        {matches.map((m) => (
          <div key={m._id} className="bg-white p-3 rounded-xl shadow">

            <h3 className="font-bold">{m.title}</h3>

            <p className="text-sm text-gray-500">
              {m.category} | Players: {m.joinedPlayers || 0}/{m.totalPlayers}
            </p>

            <p className="text-xs text-gray-400">
              Start: {m.startTime}
            </p>

            {/* ROOM */}
            <div className="mt-2 space-y-1">

              <input
                placeholder="Room ID"
                className="w-full p-1 border rounded"
                onChange={(e) =>
                  setRoomData((prev) => ({
                    ...prev,
                    [m._id]: {
                      ...prev[m._id],
                      roomId: e.target.value,
                    },
                  }))
                }
              />

              <input
                placeholder="Room Password"
                className="w-full p-1 border rounded"
                onChange={(e) =>
                  setRoomData((prev) => ({
                    ...prev,
                    [m._id]: {
                      ...prev[m._id],
                      roomPassword: e.target.value,
                    },
                  }))
                }
              />

              <button
                onClick={() => updateRoom(m._id)}
                className="w-full bg-green-600 text-white p-2 rounded"
              >
                Update Room
              </button>

            </div>
          </div>
        ))}

      </div>
    </div>
  );
};

export default AdminPanel;