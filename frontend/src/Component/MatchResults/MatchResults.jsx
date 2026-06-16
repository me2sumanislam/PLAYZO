 // ══════════════════════════════════════════════════════════════════════════════
// HYBRID MATCH RESULTS — Image viewer (বাম/উপরে) + Result entry (ডান/নিচে)
// Solo (BR Solo, CS Solo, LW Solo, Free Match): Position + Kill prize
// Custom Winner (BR Duo, BR Squad, CS Duo, CS Squad, CS 6vs6, LW Duo):
//    কোনো kill prize নেই — joined players থেকে winners select করে একটা
//    total amount দিলে সেটা winners-দের মধ্যে সমান ভাগ হবে
// ১০০% mobile friendly — ছোট স্ক্রিনে image section ও result entry section
// স্ট্যাক হয়ে যায়, সব ইনপুট ফুল-উইথ থাকে।
// ══════════════════════════════════════════════════════════════════════════════

// Match mode config — frontend এ match type বোঝার জন্য
const MODE_CONFIG = {
  br_solo: { matchType: "solo", teamSize: 1, label: "BR Solo" },
  br_duo: { matchType: "custom_winner", teamSize: 2, label: "BR Duo 2vs2" },
  br_squad: { matchType: "custom_winner", teamSize: 4, label: "BR Squad 4vs4" },
  cs_solo: { matchType: "solo", teamSize: 1, label: "Clash Squad Solo" },
  cs_duo: { matchType: "custom_winner", teamSize: 2, label: "Clash Squad Duo" },
  cs_squad: { matchType: "custom_winner", teamSize: 4, label: "Clash Squad 4vs4" },
  cs_6vs6: { matchType: "custom_winner", teamSize: 6, label: "Clash Squad 6vs6" },
  lw_solo: { matchType: "solo", teamSize: 1, label: "Lone Wolf Solo" },
  lw_duo: { matchType: "custom_winner", teamSize: 2, label: "Lone Wolf Duo" },
  free_match: { matchType: "solo", teamSize: 1, label: "Free Match" },
  training: { matchType: "solo", teamSize: 1, label: "Training" },
  // backward compat
  br_match: { matchType: "solo", teamSize: 1, label: "BR Match" },
  br_survival: { matchType: "solo", teamSize: 1, label: "BR Survival" },
  clash_squad: { matchType: "custom_winner", teamSize: 4, label: "Clash Squad" },
  cs_2vs2: { matchType: "custom_winner", teamSize: 2, label: "CS 2vs2" },
  lone_wolf: { matchType: "solo", teamSize: 1, label: "Lone Wolf" },
};

const getMatchMode = (match) => {
  const cat = match?.category || "br_solo";
  const cfg = MODE_CONFIG[cat] || MODE_CONFIG.br_solo;
  // যদি match এ matchType সরাসরি আসে (নতুন Match.js) সেটা প্রাধান্য দাও
  return {
    matchType: match?.matchType || cfg.matchType,
    teamSize: match?.teamSize || cfg.teamSize,
    label: cfg.label,
  };
};

// ── Responsive breakpoint hook ──────────────────────────────────────────────
const useIsMobile = (breakpoint = 768) => {
  const [isMobile, setIsMobile] = useState(
    typeof window !== "undefined" ? window.innerWidth < breakpoint : false,
  );
  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < breakpoint);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [breakpoint]);
  return isMobile;
};

const MatchResults = () => {
  const [matches, setMatches] = useState([]);
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [players, setPlayers] = useState([]);
  const [results, setResults] = useState([]);
  const [roomData, setRoomData] = useState({});
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({});

  // Image section state
  const [screenshots, setScreenshots] = useState([]);
  const [zoomedImg, setZoomedImg] = useState(null);

  // Custom Winner state
  const [winnerIds, setWinnerIds] = useState([]); // selected winner userId list
  const [customPrize, setCustomPrize] = useState("");

  const isMobile = useIsMobile();

  const token =
    localStorage.getItem("adminToken") || localStorage.getItem("token");

  const loadMatches = useCallback(() => {
    api("/matches").then((d) => {
      const data = Array.isArray(d) ? d : d?.data || [];
      setMatches(data.filter((m) => m.status !== "completed"));
    });
  }, []);

  useEffect(() => {
    loadMatches();
  }, [loadMatches]);

  const loadScreenshots = useCallback(
    async (matchId) => {
      try {
        const res = await fetch(`${API}/result/admin/match/${matchId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        setScreenshots(data?.data || []);
      } catch {
        setScreenshots([]);
      }
    },
    [token],
  );

  const handleMatchSelect = (id) => {
    const match = matches.find((m) => m._id === id);
    setSelectedMatch(match || null);
    setResults([]);
    setScreenshots([]);
    setWinnerIds([]);
    setCustomPrize("");
    if (id) loadScreenshots(id);
    const joined = (match?.joinedUsers || []).map((p) => ({
      ...p,
      userId: p.userId?._id?.toString() || p.userId?.toString() || p.userId,
    }));
    setPlayers(joined);
  };

  // ── Solo mode helpers ──────────────────────────────────────────────────────
  const addAllPlayers = () => {
    setResults(
      players.map((p) => ({
        userId: p.userId,
        inGameName: p.inGameName,
        position: "",
        kills: 0,
      })),
    );
  };
  const addPlayerResult = () =>
    setResults([
      ...results,
      { userId: "", inGameName: "", position: "", kills: 0 },
    ]);
  const handlePlayerSelect = (index, userId) => {
    const player = players.find((p) => p.userId === userId);
    const updated = [...results];
    updated[index].userId = userId;
    updated[index].inGameName = player?.inGameName || "";
    setResults(updated);
  };
  const handleResultChange = (index, field, value) => {
    const updated = [...results];
    updated[index][field] = value;
    setResults(updated);
  };
  const removePlayer = (index) =>
    setResults(results.filter((_, i) => i !== index));

  const calculatePrize = (position, kills) => {
    if (!selectedMatch) return 0;
    let prize = (kills || 0) * (selectedMatch.perKill || 0);
    if (position == 1) prize += selectedMatch.prizes?.first || 0;
    else if (position == 2) prize += selectedMatch.prizes?.second || 0;
    else if (position == 3) prize += selectedMatch.prizes?.third || 0;
    else if (position == 4) prize += selectedMatch.prizes?.fourth || 0;
    return Math.floor(prize);
  };

  const isAlreadyAdded = (userId, currentIndex) =>
    results.some((r, i) => i !== currentIndex && r.userId === userId);

  const totalSoloPrize = results.reduce(
    (sum, r) => sum + calculatePrize(r.position, r.kills),
    0,
  );

  const prizePool = selectedMatch
    ? (selectedMatch.prizes?.first || 0) +
      (selectedMatch.prizes?.second || 0) +
      (selectedMatch.prizes?.third || 0) +
      (selectedMatch.prizes?.fourth || 0)
    : 0;
  const isOverBudget = prizePool > 0 && totalSoloPrize > prizePool;

  // ── Custom Winner helpers ───────────────────────────────────────────────────
  const toggleWinner = (userId) => {
    setWinnerIds((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId],
    );
  };
  const prizeEachCustom =
    winnerIds.length > 0 ? Math.floor((Number(customPrize) || 0) / winnerIds.length) : 0;

  const updateRoom = async (id) => {
    const d = await api(`/matches/update-room/${id}`, {
      method: "PUT",
      body: JSON.stringify(roomData[id] || {}),
    });
    setMessage((p) => ({
      ...p,
      [id]: d.success ? "✅ Room Updated!" : "❌ Failed",
    }));
    if (d.success) loadMatches();
  };

  // ── Submit (Solo) ──────────────────────────────────────────────────────────
  const submitSoloResult = async () => {
    if (!selectedMatch) return alert("Match সিলেক্ট করুন");
    if (results.length === 0) return alert("কমপক্ষে ১ জন player যোগ করুন");
    if (results.some((r) => !r.userId)) return alert("সব player select করুন");
    const positions = results
      .map((r) => Number(r.position))
      .filter((p) => p > 0);
    if (positions.length !== new Set(positions).size)
      return alert("একই position দুজনকে দেওয়া যাবে না");
    if (isOverBudget) {
      const ok = window.confirm(
        `⚠️ Total prize ৳${totalSoloPrize} prize pool ৳${prizePool} এর বেশি! তবুও submit করবেন?`,
      );
      if (!ok) return;
    }
    setLoading(true);
    try {
      const response = await api(`/admin/matches/${selectedMatch._id}/result`, {
        method: "PUT",
        body: JSON.stringify({
          results: results.map((r) => ({
            userId: r.userId,
            inGameName: r.inGameName,
            position: Number(r.position) || 0,
            kills: Number(r.kills) || 0,
          })),
        }),
      });
      if (response.success) {
        alert("✅ Result submit হয়েছে!");
        setResults([]);
        setSelectedMatch(null);
        setPlayers([]);
        setScreenshots([]);
        loadMatches();
      } else {
        alert("❌ " + (response.message || "Failed"));
      }
    } catch {
      alert("Server Error");
    }
    setLoading(false);
  };

  // ── Submit (Custom Winner) ──────────────────────────────────────────────────
  const submitCustomWinnerResult = async () => {
    if (!selectedMatch) return alert("Match সিলেক্ট করুন");
    if (winnerIds.length === 0) return alert("কমপক্ষে ১ জন winner select করুন");
    const prizeNum = Number(customPrize) || 0;
    if (prizeNum <= 0) return alert("Prize amount দিন");

    const ok = window.confirm(
      `${winnerIds.length} জন winner-কে ৳${prizeEachCustom} করে — মোট ৳${prizeEachCustom * winnerIds.length} দেওয়া হবে। Submit করবেন?`,
    );
    if (!ok) return;

    setLoading(true);
    try {
      const response = await api(`/admin/matches/${selectedMatch._id}/result`, {
        method: "PUT",
        body: JSON.stringify({
          winnerUserIds: winnerIds,
          totalPrize: prizeNum,
        }),
      });
      if (response.success) {
        alert("✅ " + response.message);
        setSelectedMatch(null);
        setPlayers([]);
        setScreenshots([]);
        setWinnerIds([]);
        setCustomPrize("");
        loadMatches();
      } else {
        alert("❌ " + (response.message || "Failed"));
      }
    } catch {
      alert("Server Error");
    }
    setLoading(false);
  };

  const mode = selectedMatch ? getMatchMode(selectedMatch) : null;
  const isCustomWinnerMatch = mode?.matchType === "custom_winner";

  return (
    <div style={{ padding: isMobile ? 10 : 16 }}>
      {/* Zoom Modal */}
      {zoomedImg && (
        <div
          onClick={() => setZoomedImg(null)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.88)",
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "zoom-out",
            padding: 16,
          }}
        >
          <img
            src={zoomedImg}
            alt="zoomed"
            style={{ maxWidth: "92vw", maxHeight: "92vh", borderRadius: 8 }}
            onClick={(e) => e.stopPropagation()}
          />
          <button
            onClick={() => setZoomedImg(null)}
            style={{
              position: "absolute",
              top: 16,
              right: 16,
              background: "#fff",
              border: "none",
              borderRadius: "50%",
              width: 36,
              height: 36,
              fontSize: 18,
              cursor: "pointer",
              fontWeight: 700,
            }}
          >
            ✕
          </button>
        </div>
      )}

      {/* Match Select */}
      <div style={{ marginBottom: 16 }}>
        <select
          onChange={(e) => handleMatchSelect(e.target.value)}
          value={selectedMatch?._id || ""}
          style={{
            width: "100%",
            maxWidth: isMobile ? "100%" : 500,
            padding: "11px 14px",
            borderRadius: 8,
            border: "1px solid #d1d5db",
            fontSize: 14,
            outline: "none",
            boxSizing: "border-box",
          }}
        >
          <option value="">-- Match select করুন --</option>
          {matches.map((m) => {
            const cfg = getMatchMode(m);
            return (
              <option key={m._id} value={m._id}>
                {m.title} • {cfg.label} • {m.status} • {m.joinedPlayers || 0}/
                {m.totalPlayers}
              </option>
            );
          })}
        </select>
      </div>

      {selectedMatch && (
        <div
          style={{
            display: "flex",
            flexDirection: isMobile ? "column" : "row",
            gap: 16,
            alignItems: "flex-start",
          }}
        >
          {/* ══ Image Section (mobile-এ উপরে, desktop-এ বাম পাশে) ══ */}
          <div
            style={{
              width: isMobile ? "100%" : 300,
              minWidth: isMobile ? "100%" : 260,
              flexShrink: 0,
              background: "#fff",
              border: "1px solid #e5e7eb",
              borderRadius: 14,
              padding: 16,
              position: isMobile ? "static" : "sticky",
              top: 16,
              boxSizing: "border-box",
            }}
          >
            <div
              style={{
                fontSize: 13,
                fontWeight: 700,
                color: "#1e293b",
                marginBottom: 8,
                display: "flex",
                alignItems: "center",
                gap: 6,
                flexWrap: "wrap",
              }}
            >
              📁 {selectedMatch.title}
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 500,
                  color: "#7c3aed",
                  background: "#ede9fe",
                  padding: "1px 7px",
                  borderRadius: 10,
                }}
              >
                {mode?.label}
              </span>
            </div>
            <div style={{ fontSize: 11, color: "#9ca3af", marginBottom: 10 }}>
              {screenshots.length} screenshot • click করলে zoom হবে
            </div>
            {screenshots.length === 0 ? (
              <div
                style={{
                  textAlign: "center",
                  padding: "20px 0",
                  color: "#d1d5db",
                  fontSize: 12,
                }}
              >
                কোনো screenshot নেই
              </div>
            ) : (
              <div
                style={{
                  display: isMobile ? "grid" : "flex",
                  gridTemplateColumns: isMobile ? "1fr 1fr" : undefined,
                  flexDirection: isMobile ? undefined : "column",
                  gap: 8,
                }}
              >
                {screenshots.map((sub, idx) => (
                  <div
                    key={sub._id || idx}
                    style={{
                      borderRadius: 8,
                      overflow: "hidden",
                      border: "1px solid #e5e7eb",
                    }}
                  >
                    <img
                      src={sub.screenshot?.url}
                      alt=""
                      style={{
                        width: "100%",
                        display: "block",
                        cursor: "zoom-in",
                        maxHeight: isMobile ? 140 : 180,
                        objectFit: "cover",
                      }}
                      onClick={() => setZoomedImg(sub.screenshot?.url)}
                    />
                    <div
                      style={{
                        padding: "5px 8px",
                        background: "#f9fafb",
                        fontSize: 10,
                        color: "#6b7280",
                      }}
                    >
                      #{idx + 1} ·{" "}
                      {sub.submittedBy?.name ||
                        sub.submittedBy?.phone ||
                        "User"}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ══ Result Entry Section (mobile-এ নিচে, desktop-এ ডান পাশে) ══ */}
          <div style={{ flex: 1, minWidth: 0, width: "100%" }}>
            <div
              style={{
                background: "#fff",
                border: "1px solid #e5e7eb",
                borderRadius: 14,
                padding: isMobile ? 14 : 20,
                boxSizing: "border-box",
              }}
            >
              {/* Room Details */}
              <div
                style={{
                  background: "#f0f9ff",
                  border: "1px solid #bae6fd",
                  borderRadius: 10,
                  padding: 14,
                  marginBottom: 16,
                }}
              >
                <div
                  style={{
                    fontWeight: 700,
                    color: "#0369a1",
                    marginBottom: 10,
                    fontSize: 13,
                  }}
                >
                  🔑 Room Details
                </div>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
                    gap: 10,
                    marginBottom: 10,
                  }}
                >
                  <div>
                    <div
                      style={{
                        fontSize: 11,
                        marginBottom: 4,
                        color: "#6b7280",
                      }}
                    >
                      Room ID
                    </div>
                    <input
                      placeholder="Room ID"
                      defaultValue={selectedMatch.roomId || ""}
                      onChange={(e) =>
                        setRoomData((p) => ({
                          ...p,
                          [selectedMatch._id]: {
                            ...p[selectedMatch._id],
                            roomId: e.target.value,
                          },
                        }))
                      }
                      style={{
                        width: "100%",
                        padding: 9,
                        borderRadius: 6,
                        border: "1px solid #bae6fd",
                        boxSizing: "border-box",
                        fontSize: 13,
                      }}
                    />
                  </div>
                  <div>
                    <div
                      style={{
                        fontSize: 11,
                        marginBottom: 4,
                        color: "#6b7280",
                      }}
                    >
                      Password
                    </div>
                    <input
                      placeholder="Room Password"
                      defaultValue={selectedMatch.roomPassword || ""}
                      onChange={(e) =>
                        setRoomData((p) => ({
                          ...p,
                          [selectedMatch._id]: {
                            ...p[selectedMatch._id],
                            roomPassword: e.target.value,
                          },
                        }))
                      }
                      style={{
                        width: "100%",
                        padding: 9,
                        borderRadius: 6,
                        border: "1px solid #bae6fd",
                        boxSizing: "border-box",
                        fontSize: 13,
                      }}
                    />
                  </div>
                </div>
                <button
                  onClick={() => updateRoom(selectedMatch._id)}
                  style={{
                    width: "100%",
                    padding: 9,
                    background: "#0284c7",
                    color: "white",
                    border: "none",
                    borderRadius: 8,
                    cursor: "pointer",
                    fontSize: 13,
                    fontWeight: 600,
                  }}
                >
                  Update Room Details
                </button>
                {message[selectedMatch._id] && (
                  <p
                    style={{
                      marginTop: 6,
                      color: "#0369a1",
                      fontWeight: 600,
                      fontSize: 12,
                    }}
                  >
                    {message[selectedMatch._id]}
                  </p>
                )}
              </div>

              {/* ══ CUSTOM WINNER UI — BR Squad / CS Duo / CS Squad / CS 6vs6 / LW Duo ══ */}
              {isCustomWinnerMatch && (
                <div>
                  <div
                    style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}
                  >
                    🏆 Custom Winner — {mode.label}
                  </div>
                  <div
                    style={{
                      fontSize: 12,
                      color: "#6b7280",
                      marginBottom: 14,
                      lineHeight: 1.5,
                    }}
                  >
                    Player রা room-এর ভিতরে নিজেরা team বানিয়ে খেলেছে। Screenshot
                    দেখে winner হওয়া player(দের) select করুন এবং মোট prize
                    amount দিন — সেটা winners-দের মধ্যে সমান ভাগ হয়ে যাবে।
                  </div>

                  {/* Joined players — checkbox select */}
                  <div
                    style={{
                      fontWeight: 700,
                      fontSize: 13,
                      marginBottom: 8,
                      color: "#374151",
                    }}
                  >
                    📋 Joined Players ({players.length} জন) — Winner select করুন
                  </div>

                  {players.length === 0 ? (
                    <div
                      style={{
                        textAlign: "center",
                        padding: "16px 0",
                        color: "#d1d5db",
                        fontSize: 12,
                      }}
                    >
                      কেউ join করেনি
                    </div>
                  ) : (
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: isMobile
                          ? "1fr"
                          : "1fr 1fr",
                        gap: 8,
                        marginBottom: 16,
                      }}
                    >
                      {players.map((p, i) => {
                        const isWinner = winnerIds.includes(p.userId);
                        return (
                          <div
                            key={p.userId || i}
                            onClick={() => toggleWinner(p.userId)}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 10,
                              padding: "10px 12px",
                              borderRadius: 10,
                              border: `2px solid ${isWinner ? "#22c55e" : "#e5e7eb"}`,
                              background: isWinner ? "#f0fdf4" : "#f9fafb",
                              cursor: "pointer",
                              userSelect: "none",
                            }}
                          >
                            <div
                              style={{
                                width: 20,
                                height: 20,
                                borderRadius: 5,
                                border: `2px solid ${isWinner ? "#22c55e" : "#d1d5db"}`,
                                background: isWinner ? "#22c55e" : "#fff",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                flexShrink: 0,
                                fontSize: 12,
                                color: "#fff",
                                fontWeight: 800,
                              }}
                            >
                              {isWinner ? "✓" : ""}
                            </div>
                            <span
                              style={{
                                fontSize: 13,
                                fontWeight: isWinner ? 700 : 500,
                                color: isWinner ? "#15803d" : "#374151",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                              }}
                            >
                              {p.inGameName || `Slot #${p.slotNumber}`}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Prize amount input */}
                  <div style={{ marginBottom: 14 }}>
                    <div
                      style={{
                        fontSize: 13,
                        fontWeight: 700,
                        marginBottom: 6,
                        color: "#374151",
                      }}
                    >
                      💰 মোট Prize Amount
                    </div>
                    <input
                      type="number"
                      min="0"
                      inputMode="numeric"
                      placeholder="যেমন: 600"
                      value={customPrize}
                      onChange={(e) => setCustomPrize(e.target.value)}
                      style={{
                        width: "100%",
                        padding: 12,
                        borderRadius: 8,
                        border: "1.5px solid #d1d5db",
                        fontSize: 16,
                        boxSizing: "border-box",
                        outline: "none",
                      }}
                    />
                  </div>

                  {/* Prize Summary */}
                  <div
                    style={{
                      background:
                        winnerIds.length > 0 && Number(customPrize) > 0
                          ? "#f0fdf4"
                          : "#f9fafb",
                      border: `1px solid ${
                        winnerIds.length > 0 && Number(customPrize) > 0
                          ? "#bbf7d0"
                          : "#e5e7eb"
                      }`,
                      borderRadius: 10,
                      padding: 14,
                      marginBottom: 14,
                    }}
                  >
                    <div
                      style={{
                        fontWeight: 700,
                        color: "#15803d",
                        fontSize: 13,
                        marginBottom: 4,
                      }}
                    >
                      Prize Summary
                    </div>
                    {winnerIds.length > 0 ? (
                      <div style={{ fontSize: 13, color: "#374151" }}>
                        {winnerIds.length} জন winner × ৳{prizeEachCustom} ={" "}
                        ৳{prizeEachCustom * winnerIds.length}
                      </div>
                    ) : (
                      <div style={{ fontSize: 12, color: "#9ca3af" }}>
                        winner select করুন
                      </div>
                    )}
                  </div>

                  <button
                    onClick={submitCustomWinnerResult}
                    disabled={
                      loading || winnerIds.length === 0 || !Number(customPrize)
                    }
                    style={{
                      width: "100%",
                      padding: 14,
                      background:
                        loading || winnerIds.length === 0 || !Number(customPrize)
                          ? "#9ca3af"
                          : "#22c55e",
                      color: "white",
                      border: "none",
                      borderRadius: 12,
                      fontSize: 15,
                      fontWeight: 700,
                      cursor:
                        loading || winnerIds.length === 0 || !Number(customPrize)
                          ? "not-allowed"
                          : "pointer",
                    }}
                  >
                    {loading
                      ? "Submitting..."
                      : `✅ ${winnerIds.length || 0} জন Winner — Submit করুন`}
                  </button>
                </div>
              )}

              {/* ══ SOLO-STYLE MATCH UI (BR Solo, BR Duo, CS Solo, LW Solo, Free Match) ══ */}
              {!isCustomWinnerMatch && (
                <div>
                  {/* Prize Info */}
                  <div
                    style={{
                      background: "#fffbeb",
                      border: "1px solid #fde68a",
                      borderRadius: 10,
                      padding: 12,
                      marginBottom: 16,
                      display: "flex",
                      gap: 16,
                      flexWrap: "wrap",
                      fontSize: 12,
                      fontWeight: 600,
                    }}
                  >
                    <span>🥇 1st: ৳{selectedMatch.prizes?.first || 0}</span>
                    <span>🥈 2nd: ৳{selectedMatch.prizes?.second || 0}</span>
                    <span>🥉 3rd: ৳{selectedMatch.prizes?.third || 0}</span>
                    <span>4️⃣ 4th: ৳{selectedMatch.prizes?.fourth || 0}</span>
                    <span>🔫 Per Kill: ৳{selectedMatch.perKill || 0}</span>
                    {prizePool > 0 && (
                      <span style={{ color: "#7c3aed", marginLeft: isMobile ? 0 : "auto" }}>
                        Prize Pool: ৳{prizePool}
                      </span>
                    )}
                  </div>

                  {/* Joined Players */}
                  {players.length > 0 && (
                    <div
                      style={{
                        background: "#f0fdf4",
                        border: "1px solid #bbf7d0",
                        borderRadius: 10,
                        padding: 12,
                        marginBottom: 16,
                      }}
                    >
                      <div
                        style={{
                          fontWeight: 700,
                          color: "#15803d",
                          marginBottom: 8,
                          fontSize: 12,
                        }}
                      >
                        📋 Joined Players ({players.length} জন)
                      </div>
                      <div
                        style={{ display: "flex", flexWrap: "wrap", gap: 6 }}
                      >
                        {players.map((p, i) => (
                          <span
                            key={i}
                            style={{
                              background: "#fff",
                              border: "1px solid #86efac",
                              borderRadius: 6,
                              padding: "3px 8px",
                              fontSize: 11,
                              fontWeight: 600,
                              color: "#166534",
                            }}
                          >
                            {p.inGameName || `Slot #${p.slotNumber}`}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Player Results */}
                  <div
                    style={{ fontWeight: 700, fontSize: 14, marginBottom: 12 }}
                  >
                    🎮 Player Results
                  </div>
                  <div
                    style={{
                      display: "flex",
                      gap: 10,
                      marginBottom: 14,
                      flexWrap: "wrap",
                    }}
                  >
                    <button
                      onClick={addAllPlayers}
                      disabled={
                        players.length === 0 ||
                        results.length === players.length
                      }
                      style={{
                        padding: "9px 16px",
                        background: "#8b5cf6",
                        color: "white",
                        border: "none",
                        borderRadius: 8,
                        cursor: "pointer",
                        fontWeight: 600,
                        fontSize: 13,
                        opacity: players.length === 0 ? 0.5 : 1,
                        flex: isMobile ? "1 1 auto" : undefined,
                      }}
                    >
                      ⚡ Add All {players.length} Players
                    </button>
                    <button
                      onClick={addPlayerResult}
                      style={{
                        padding: "9px 16px",
                        background: "#3b82f6",
                        color: "white",
                        border: "none",
                        borderRadius: 8,
                        cursor: "pointer",
                        fontWeight: 600,
                        fontSize: 13,
                        flex: isMobile ? "1 1 auto" : undefined,
                      }}
                    >
                      + Add Player
                    </button>
                  </div>

                  {results.map((res, index) => (
                    <div
                      key={index}
                      style={{
                        background: "#f9fafb",
                        border: "1px solid #e5e7eb",
                        borderRadius: 10,
                        padding: 12,
                        marginBottom: 8,
                      }}
                    >
                      <div
                        style={{
                          display: isMobile ? "grid" : "grid",
                          gridTemplateColumns: isMobile
                            ? "1fr 1fr"
                            : "2fr 110px 90px 100px 40px",
                          gap: 8,
                          alignItems: "center",
                        }}
                      >
                        <div style={{ gridColumn: isMobile ? "1 / -1" : "auto" }}>
                          <select
                            value={res.userId}
                            onChange={(e) =>
                              handlePlayerSelect(index, e.target.value)
                            }
                            style={{
                              width: "100%",
                              padding: 9,
                              borderRadius: 6,
                              border: "1px solid #d1d5db",
                              fontSize: 12,
                              boxSizing: "border-box",
                            }}
                          >
                            <option value="">-- Select --</option>
                            {players.map((p) => (
                              <option
                                key={p.userId}
                                value={p.userId}
                                disabled={isAlreadyAdded(p.userId, index)}
                              >
                                {p.inGameName || `Slot #${p.slotNumber}`}
                              </option>
                            ))}
                          </select>
                          {res.inGameName && (
                            <div
                              style={{
                                fontSize: 11,
                                color: "#16a34a",
                                fontWeight: 600,
                                marginTop: 3,
                              }}
                            >
                              ✅ {res.inGameName}
                            </div>
                          )}
                        </div>
                        <select
                          value={res.position}
                          onChange={(e) =>
                            handleResultChange(
                              index,
                              "position",
                              e.target.value,
                            )
                          }
                          style={{
                            width: "100%",
                            padding: 9,
                            borderRadius: 6,
                            border: "1px solid #d1d5db",
                            fontSize: 12,
                            boxSizing: "border-box",
                          }}
                        >
                          <option value="">Pos</option>
                          {Array.from({ length: 48 }, (_, i) => i + 1).map(
                            (n) => (
                              <option key={n} value={n}>
                                {n}
                              </option>
                            ),
                          )}
                        </select>
                        <input
                          type="number"
                          min="0"
                          inputMode="numeric"
                          value={res.kills}
                          onChange={(e) =>
                            handleResultChange(
                              index,
                              "kills",
                              parseInt(e.target.value) || 0,
                            )
                          }
                          style={{
                            width: "100%",
                            padding: 9,
                            borderRadius: 6,
                            border: "1px solid #d1d5db",
                            fontSize: 12,
                            boxSizing: "border-box",
                          }}
                          placeholder="Kills"
                        />
                        <div
                          style={{
                            textAlign: "center",
                            fontWeight: 700,
                            fontSize: 14,
                            color:
                              calculatePrize(res.position, res.kills) > 0
                                ? "#16a34a"
                                : "#9ca3af",
                          }}
                        >
                          ৳{calculatePrize(res.position, res.kills)}
                        </div>
                        <button
                          onClick={() => removePlayer(index)}
                          style={{
                            background: "#fee2e2",
                            border: "none",
                            borderRadius: 6,
                            color: "#dc2626",
                            fontWeight: 700,
                            padding: "7px 10px",
                            cursor: "pointer",
                            fontSize: 13,
                          }}
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  ))}

                  {/* Total Prize + Prize Pool Check */}
                  {results.length > 0 && (
                    <div
                      style={{
                        borderRadius: 10,
                        padding: 14,
                        marginTop: 8,
                        background: isOverBudget ? "#fef2f2" : "#f0fdf4",
                        border: `1px solid ${isOverBudget ? "#fecaca" : "#bbf7d0"}`,
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                        }}
                      >
                        <span
                          style={{
                            fontWeight: 600,
                            color: isOverBudget ? "#b91c1c" : "#15803d",
                            fontSize: 13,
                          }}
                        >
                          Total Prize Distribution
                        </span>
                        <span
                          style={{
                            fontWeight: 800,
                            fontSize: 20,
                            color: isOverBudget ? "#b91c1c" : "#15803d",
                          }}
                        >
                          ৳{totalSoloPrize}
                        </span>
                      </div>
                      {prizePool > 0 && (
                        <div
                          style={{
                            marginTop: 6,
                            fontSize: 12,
                            color: isOverBudget ? "#b91c1c" : "#6b7280",
                          }}
                        >
                          {isOverBudget
                            ? `⚠️ Prize Pool ৳${prizePool} — বেশি হয়ে গেছে ৳${totalSoloPrize - prizePool}!`
                            : `✅ Prize Pool ৳${prizePool} — বাকি আছে ৳${prizePool - totalSoloPrize}`}
                        </div>
                      )}
                    </div>
                  )}

                  <button
                    onClick={submitSoloResult}
                    disabled={loading || results.length === 0}
                    style={{
                      marginTop: 14,
                      width: "100%",
                      padding: 14,
                      background: loading
                        ? "#9ca3af"
                        : isOverBudget
                          ? "#dc2626"
                          : "#22c55e",
                      color: "white",
                      border: "none",
                      borderRadius: 12,
                      fontSize: 15,
                      fontWeight: 700,
                      cursor: loading ? "not-allowed" : "pointer",
                    }}
                  >
                    {loading
                      ? "Submitting..."
                      : `✅ Submit Result (${results.length} players)`}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};