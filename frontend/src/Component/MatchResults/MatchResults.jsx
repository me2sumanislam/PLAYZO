import React, { useEffect, useState } from "react";

const API = "https://playzo-vn8e.onrender.com/api";

const api = async (path, opts = {}) => {
  const token = localStorage.getItem("token");

  const res = await fetch(`${API}${path}`, {
    ...opts,

    headers: {
      "Content-Type": "application/json",

      Authorization: `Bearer ${token}`,

      ...(opts.headers || {}),
    },
  });

  return res.json();
};

const MatchResults = ({ selectedMatch, refreshMatches }) => {
  const [winners, setWinners] = useState([]);

  const [totalPrizeAmount, setTotalPrizeAmount] = useState("");

  useEffect(() => {
    setWinners([]);
    setTotalPrizeAmount("");
  }, [selectedMatch]);

  if (!selectedMatch) {
    return null;
  }

  const joinedPlayers = selectedMatch.joinedUsers || [];

  const toggleWinner = (player) => {
    const exists = winners.find((w) => w.userId === player.userId);

    if (exists) {
      setWinners(winners.filter((w) => w.userId !== player.userId));
    } else {
      setWinners([
        ...winners,
        {
          userId: player.userId,

          inGameName: player.inGameName,

          prize: 0,
        },
      ]);
    }
  };

  const perWinnerAmount =
    winners.length > 0
      ? Math.floor(Number(totalPrizeAmount || 0) / winners.length)
      : 0;

  const submitCustomWinners = async () => {
    try {
      if (!winners.length) {
        return alert("Select at least 1 winner");
      }

      if (!Number(totalPrizeAmount)) {
        return alert("Enter total prize amount");
      }

      const payloadWinners = winners.map((w) => ({
        ...w,
        prize: perWinnerAmount,
      }));

      const data = await api(`/result/admin/distribute/${selectedMatch._id}`, {
        method: "PUT",

        body: JSON.stringify({
          winners: payloadWinners,
        }),
      });

      if (!data.success) {
        return alert(data.message);
      }

      alert(data.message);

      refreshMatches?.();

      setWinners([]);

      setTotalPrizeAmount("");
    } catch (err) {
      console.error(err);

      alert("Server Error");
    }
  };

  return (
    <div
      style={{
        padding: 20,
      }}
    >
      <h2>{selectedMatch.title}</h2>

      <div
        style={{
          marginTop: 20,
        }}
      >
        <h3>Joined Players</h3>

        {joinedPlayers.map((player, index) => {
          const selected = winners.find((w) => w.userId === player.userId);

          return (
            <div
              key={index}
              style={{
                border: "1px solid #ccc",

                padding: 10,

                marginBottom: 10,

                borderRadius: 8,

                background: selected ? "#d4ffd4" : "#fff",
              }}
            >
              <div>
                <strong>{player.inGameName}</strong>
              </div>

              <button onClick={() => toggleWinner(player)}>
                {selected ? "Remove Winner" : "Select Winner"}
              </button>
            </div>
          );
        })}
      </div>

      <div
        style={{
          marginTop: 30,
        }}
      >
        <h3>Prize Distribution</h3>

        <input
          type="number"
          placeholder="Total Prize Amount"
          value={totalPrizeAmount}
          onChange={(e) => setTotalPrizeAmount(e.target.value)}
          style={{
            padding: 10,
            width: 250,
          }}
        />

        <div
          style={{
            marginTop: 10,
          }}
        >
          Winners Selected: {winners.length}
        </div>

        <div>Per Winner Prize: ৳{perWinnerAmount}</div>

        <button
          onClick={submitCustomWinners}
          style={{
            marginTop: 20,

            padding: "12px 20px",

            background: "green",

            color: "#fff",

            border: "none",

            borderRadius: 6,

            cursor: "pointer",
          }}
        >
          Submit Winners
        </button>
      </div>
    </div>
  );
};

export default MatchResults;
