 import React from "react";
import MatchCard from "../MatchCard/MatchCard";

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
              className="cursor-pointer active:scale-95 transition"
            >
              <MatchCard match={match} />
            </div>
          ))
        )}

      </div>
    </div>
  );
};

export default MatchList;