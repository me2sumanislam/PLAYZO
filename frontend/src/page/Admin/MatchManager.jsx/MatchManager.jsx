 import React, { useState } from "react";

const MatchManager = () => {
  const [matches, setMatches] = useState([]);
  const [title, setTitle] = useState("");
  const [showForm, setShowForm] = useState(false);

  // create match
  const handleCreate = () => {
    if (!title.trim()) return;

    const newMatch = {
      id: Date.now(),
      name: title,
    };

    setMatches([newMatch, ...matches]);
    setTitle("");
    setShowForm(false);
  };

  return (
    <div className="bg-white rounded-2xl p-4 shadow">

      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-black">Match Manager</h3>

        <button
          onClick={() => setShowForm(true)}
          className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm"
        >
          + Create
        </button>
      </div>

      {/* Create Form */}
      {showForm && (
        <div className="mb-4 border p-3 rounded-xl">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="border p-2 w-full rounded-lg mb-2"
            placeholder="Match name লিখুন"
          />

          <div className="flex gap-2">
            <button
              onClick={handleCreate}
              className="bg-green-600 text-white px-3 py-1 rounded-lg"
            >
              Save
            </button>

            <button
              onClick={() => setShowForm(false)}
              className="bg-gray-400 text-white px-3 py-1 rounded-lg"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Match List */}
      <div className="space-y-2">
        {matches.length === 0 ? (
          <p className="text-sm text-gray-500">No match created yet</p>
        ) : (
          matches.map((m) => (
            <div
              key={m.id}
              className="p-2 border rounded-lg bg-gray-50"
            >
              {m.name}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default MatchManager;