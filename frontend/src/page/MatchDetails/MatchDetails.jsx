 import React from "react";

const MatchDetails = ({ match, onBack }) => {
  if (!match) return null;

  return (
    <div className="bg-gray-100 min-h-screen max-w-[450px] mx-auto pb-24">

      <div className="bg-white p-4 flex items-center gap-3 shadow">
        <button onClick={onBack}>←</button>
        <h2 className="font-bold">{match.title}</h2>
      </div>

      <div className="p-4 space-y-3">

        <div className="bg-white p-4 rounded-xl shadow">
          <p className="text-sm">Category</p>
          <b>{match.category}</b>
        </div>

        <div className="bg-white p-4 rounded-xl shadow">
          <p className="text-sm">Entry Fee</p>
          <b>৳ {match.entryFee}</b>
        </div>

        <div className="bg-white p-4 rounded-xl shadow">
          <p className="text-sm">Win Prize</p>
          <b>৳ {match.winPrize}</b>
        </div>

        <button className="w-full bg-green-500 text-white p-3 rounded-xl font-bold">
          JOIN MATCH
        </button>

      </div>
    </div>
  );
};

export default MatchDetails;