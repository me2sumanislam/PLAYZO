 import React from "react";

const MatchList = ({ matches, onBack, onSelectMatch, title }) => {
  return (
    <div className="bg-gray-100 min-h-screen max-w-[450px] mx-auto pb-24">

      {/* HEADER → dynamic name */}
      <div className="bg-white p-4 flex items-center gap-3 shadow">
        <button onClick={onBack}>←</button>

        <h2 className="font-bold uppercase">
          {title}
        </h2>
      </div>

      {/* COUNT */}
      <div className="p-3">
        <p className="text-sm text-gray-600">
          Total Matches: <b>{matches.length}</b>
        </p>
      </div>

      {/* LIST */}
      <div className="p-3 space-y-3">

        {matches.length === 0 ? (
          <p className="text-center text-gray-400">
            No Match Available
          </p>
        ) : (
          matches.map((match) => (
            <div
              key={match._id || match.id}
              onClick={() => onSelectMatch(match)}
              className="bg-white p-4 rounded-xl shadow cursor-pointer active:scale-95 transition"
            >
              <h3 className="font-bold text-sm">
                {match.title}
              </h3>

              <p className="text-xs text-gray-500 mt-1">
                Category: {match.category}
              </p>

              <p className="text-xs text-gray-500">
                Entry: ৳{match.entryFee} | Win: ৳{match.winPrize}
              </p>
            </div>
          ))
        )}

      </div>
    </div>
  );
};

export default MatchList;