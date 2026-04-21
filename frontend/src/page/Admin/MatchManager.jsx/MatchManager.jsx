 import React from "react";

const MatchManager = () => {
  return (
    <div className="bg-white rounded-2xl p-4 shadow">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-black">Match Manager</h3>
        <button className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm">
          + Create
        </button>
      </div>

      <p className="text-sm text-gray-500">
        এখান থেকে match create / edit / delete করা যাবে।
      </p>
    </div>
  );
};

export default MatchManager;