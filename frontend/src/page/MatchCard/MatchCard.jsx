 import React, { useEffect, useState } from "react";

const MatchCard = ({ match, onClick }) => {
  const [timeLeft, setTimeLeft] = useState("");

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date().getTime();

      // ✅ PRIORITY: admin countdown (minutes)
      let startTime;

      if (match.startCountdown) {
        startTime =
          now + Number(match.startCountdown) * 60 * 1000;
      } else {
        startTime = new Date(match.startTime).getTime();
      }

      const distance = startTime - now;

      if (distance <= 0) {
        setTimeLeft("Custom Ready Room Details থেকে নিন");
        clearInterval(timer);
        return;
      }

      const hours = Math.floor(distance / (1000 * 60 * 60));
      const minutes = Math.floor(
        (distance % (1000 * 60 * 60)) / (1000 * 60)
      );
      const seconds = Math.floor((distance % (1000 * 60)) / 1000);

      setTimeLeft(
        `${hours > 0 ? `${hours}h ` : ""}${minutes}m:${seconds}s`
      );
    }, 1000);

    return () => clearInterval(timer);
  }, [match.startTime, match.startCountdown]);

  const joined = Number(match.joinedPlayers || 0);
  const total = Number(match.totalPlayers || 0);
  const spotsLeft = total - joined;
  const isFull = joined >= total;

  return (
    <div
      onClick={onClick}
      className="bg-white rounded-2xl shadow-md overflow-hidden cursor-pointer"
    >
      <div className="p-3">
        {/* top */}
        <div className="flex gap-3">
          <img
            src={match.image || "/image/img-1.jpg"}
            alt=""
            className="w-28 h-16 rounded object-cover"
          />

          <div className="flex-1">
            <h3 className="font-bold text-lg leading-tight">
              {match.title} | {match.device || "Mobile"} | Regular
            </h3>

            <p className="text-red-400 text-sm mt-1">
              {new Date(match.startTime).toLocaleString()}
            </p>
          </div>
        </div>

        {/* middle stats */}
        <div className="grid grid-cols-3 gap-y-6 text-center mt-6">
          <div>
            <p className="text-gray-500 text-sm font-semibold">WIN PRIZE</p>
            <p className="font-bold text-2xl">{match.winPrize} TK</p>
          </div>

          <div>
            <p className="text-gray-500 text-sm font-semibold">ENTRY TYPE</p>
            <p className="font-bold text-2xl capitalize">
              {match.category}
            </p>
          </div>

          <div>
            <p className="text-gray-500 text-sm font-semibold">ENTRY FEE</p>
            <p className="font-bold text-2xl">{match.entryFee} TK</p>
          </div>

          <div>
            <p className="text-gray-500 text-sm font-semibold">PER KILL</p>
            <p className="font-bold text-2xl">{match.perKill || 0} TK</p>
          </div>

          <div>
            <p className="text-gray-500 text-sm font-semibold">MAP</p>
            <p className="font-bold text-2xl">{match.map || "Bermuda"}</p>
          </div>

          <div>
            <p className="text-gray-500 text-sm font-semibold">VERSION</p>
            <p className="font-bold text-2xl uppercase">
              {match.device || "MOBILE"}
            </p>
          </div>
        </div>

        {/* progress */}
        <div className="flex items-center gap-3 mt-6">
          <div className="flex-1">
            <div className="h-4 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-green-500"
                style={{
                  width: `${total ? (joined / total) * 100 : 0}%`,
                }}
              />
            </div>

            <div className="flex justify-between text-sm mt-1 text-gray-500">
              <span>Only {spotsLeft} spots are left</span>
              <span>
                {joined}/{total}
              </span>
            </div>
          </div>

          {/* JOIN / FULL BUTTON */}
          <div>
            {isFull ? (
              <div className="bg-red-500 text-white px-4 py-3 rounded-xl font-bold text-center">
                Match Full
              </div>
            ) : (
              <button className="bg-green-600 hover:bg-green-700 text-white px-4 py-3 rounded-xl font-bold">
                Join
              </button>
            )}
          </div>
        </div>

        {/* buttons */}
        <div className="grid grid-cols-2 gap-2 mt-4">
          <button className="border border-blue-500 rounded-lg py-2 font-semibold text-blue-700">
            🔑 Room Details
          </button>

          <button className="border border-blue-500 rounded-lg py-2 font-semibold text-blue-700">
            🏆 Total Prize
          </button>
        </div>
      </div>

      {/* footer */}
      <div className="bg-green-700 text-white text-center py-3 font-semibold">
        {isFull
          ? "কাস্টম Ready Room Details থেকে নিন"
          : `⏰ STARTS IN - ${timeLeft}`}
      </div>
    </div>
  );
};

export default MatchCard;