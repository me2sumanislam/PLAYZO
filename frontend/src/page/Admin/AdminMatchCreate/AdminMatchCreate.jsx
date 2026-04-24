 import React, { useState } from "react";

const AdminMatchCreate = () => {
  const [form, setForm] = useState({
    title: "",
    category: "solo",
    winPrize: "",
    entryFee: "",
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    try {
      await fetch("/api/matches", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      alert("Match Created Successfully");

      setForm({
        title: "",
        category: "solo",
        winPrize: "",
        entryFee: "",
      });
    } catch (err) {
      alert("Error creating match");
    }
  };

  return (
    <div className="max-w-[450px] mx-auto min-h-screen bg-gray-100 p-4">

      <h2 className="text-xl font-bold mb-4">Create Match</h2>

      <input
        name="title"
        value={form.title}
        onChange={handleChange}
        placeholder="Match Title"
        className="w-full p-3 mb-3 rounded bg-white"
      />

      <select
        name="category"
        value={form.category}
        onChange={handleChange}
        className="w-full p-3 mb-3 rounded bg-white"
      >
        <option value="solo">Solo</option>
        <option value="duo">Duo</option>
        <option value="squad">Squad</option>
        <option value="cs">CS</option>
        <option value="custom">Custom</option>
        <option value="tournament">Tournament</option>
      </select>

      <input
        name="winPrize"
        value={form.winPrize}
        onChange={handleChange}
        placeholder="Win Prize"
        className="w-full p-3 mb-3 rounded bg-white"
      />

      <input
        name="entryFee"
        value={form.entryFee}
        onChange={handleChange}
        placeholder="Entry Fee"
        className="w-full p-3 mb-3 rounded bg-white"
      />

      <button
        onClick={handleSubmit}
        className="w-full bg-green-500 text-white p-3 rounded font-bold"
      >
        Create Match
      </button>
    </div>
  );
};

export default AdminMatchCreate;