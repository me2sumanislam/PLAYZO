 import React, { useEffect, useState } from "react";

const AdminRoomUpdate = () => {
  const [matches, setMatches] = useState([]);
  const [selectedMatch, setSelectedMatch] = useState("");
  const [roomId, setRoomId] = useState("");
  const [roomPassword, setRoomPassword] = useState("");

  // ================= FETCH MATCHES =================
  useEffect(() => {
    const loadMatches = async () => {
      try {
        const res = await fetch("http://localhost:5000/api/matches");
        const data = await res.json();
        setMatches(data);
      } catch (err) {
        setMatches([]);
      }
    };

    loadMatches();
  }, []);

  // ================= UPDATE ROOM =================
  const handleUpdate = async () => {
    if (!selectedMatch) {
      alert("Select a match first");
      return;
    }

    try {
      const res = await fetch(
        `http://localhost:5000/api/matches/update-room/${selectedMatch}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            roomId,
            roomPassword,
          }),
        }
      );

      const data = await res.json();

      if (data._id) {
        alert("Room Updated Successfully 🚀");

        setRoomId("");
        setRoomPassword("");
      } else {
        alert("Update Failed");
      }
    } catch (err) {
      alert("Server Error");
      console.log(err);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex justify-center items-center p-3">
      <div className="w-full max-w-[450px] bg-white rounded-2xl shadow p-4">

        <h2 className="text-center font-bold text-xl text-red-500 mb-4">
          ADMIN ROOM UPDATE
        </h2>

        {/* MATCH SELECT */}
        <select
          className="w-full p-3 border rounded-xl mb-3"
          onChange={(e) => setSelectedMatch(e.target.value)}
        >
          <option value="">Select Match</option>
          {matches.map((m) => (
            <option key={m._id} value={m._id}>
              {m.title} ({m.category})
            </option>
          ))}
        </select>

        {/* ROOM ID */}
        <input
          type="text"
          placeholder="Room ID"
          value={roomId}
          onChange={(e) => setRoomId(e.target.value)}
          className="w-full p-3 border rounded-xl mb-3"
        />

        {/* PASSWORD */}
        <input
          type="text"
          placeholder="Room Password"
          value={roomPassword}
          onChange={(e) => setRoomPassword(e.target.value)}
          className="w-full p-3 border rounded-xl mb-3"
        />

        {/* BUTTON */}
        <button
          onClick={handleUpdate}
          className="w-full bg-green-600 text-white p-3 rounded-xl font-bold active:scale-95"
        >
          UPDATE ROOM
        </button>

      </div>
    </div>
  );
};

export default AdminRoomUpdate;