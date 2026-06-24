 import React, { useState, useEffect, useCallback, useRef } from "react";

const API = "https://playzo-vn8e.onrender.com/api";

const fmt = (n) => "৳" + Number(n || 0).toLocaleString();

// ── Countdown Timer ──────────────────────────────────────────────────────────
const TimeLeft = ({ startTime }) => {
  const [time, setTime] = useState("");
  useEffect(() => {
    const calc = () => {
      const diff = new Date(startTime).getTime() - Date.now();
      if (diff <= 0) { setTime("শুরু হয়েছে"); return; }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setTime(h > 0 ? `${h}h ${m}m ${s}s` : `${m}m ${s}s`);
    };
    calc();
    const t = setInterval(calc, 1000);
    return () => clearInterval(t);
  }, [startTime]);
  return <span>{time}</span>;
};

// ── Screenshot Upload ────────────────────────────────────────────────────────
const ScreenshotUpload = ({ matchId }) => {
  const [file, setFile]       = useState(null);
  const [preview, setPreview] = useState(null);
  const [status, setStatus]   = useState("idle");
  const [msg, setMsg]         = useState("");
  const [result, setResult]   = useState(null);
  const fileRef               = useRef();
  const token                 = localStorage.getItem("token");

  // ✅ FIX: matchId বদলালে সব state reset — এটাই 2nd user এর problem ঠিক করবে
  useEffect(() => {
    setFile(null);
    setPreview(null);
    setStatus("idle");
    setMsg("");
    setResult(null);
    if (fileRef.current) fileRef.current.value = "";
    checkResult();
  }, [matchId]);

  const checkResult = async () => {
    try {
      const res = await fetch(`${API}/result/my/${matchId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.data) setResult(data.data);
      }
    } catch { /* silent */ }
  };

  const handleFile = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    if (!f.type.startsWith("image/")) { setMsg("শুধু image file দিন"); return; }
    if (f.size > 8 * 1024 * 1024)    { setMsg("8MB এর বেশি না"); return; }
    setFile(f);
    setPreview(URL.createObjectURL(f));
    setMsg("");
  };

  const handleUpload = async () => {
    if (!file) return;
    setStatus("uploading");
    const form = new FormData();
    form.append("screenshot", file);
    try {
      const res  = await fetch(`${API}/result/upload/${matchId}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: form,
      });
      const data = await res.json();
      if (data.success) {
        setStatus("idle");
        setMsg("✅ Submit সফল হয়েছে! Admin review করবে।");
        setFile(null);
        setPreview(null);
        if (fileRef.current) fileRef.current.value = "";
        checkResult();
      } else {
        setStatus("error");
        setMsg(data.message || "Upload হয়নি");
      }
    } catch {
      setStatus("error");
      setMsg("Network error");
    }
  };

  const statusColor = {
    processing:     "#92400e",
    pending_review: "#1e40af",
    approved:       "#065f46",
    rejected:       "#991b1b",
    published:      "#5b21b6",
  };
  const statusBg = {
    processing:     "#fef3c7",
    pending_review: "#dbeafe",
    approved:       "#d1fae5",
    rejected:       "#fee2e2",
    published:      "#ede9fe",
  };
  const statusLabel = {
    processing:     "⏳ OCR চলছে",
    pending_review: "🔍 Admin review এ আছে",
    approved:       "✅ Approved",
    rejected:       "❌ Rejected",
    published:      "🏆 Result Published",
  };

  if (result) {
    return (
      <div style={{ padding: "10px 16px 16px", borderTop: "1px solid #f3f4f6" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: "#374151" }}>📸 Result Status</span>
          <span style={{
            padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700,
            background: statusBg[result.status] || "#f3f4f6",
            color: statusColor[result.status] || "#374151",
          }}>
            {statusLabel[result.status] || result.status}
          </span>
        </div>

        {result.status === "published" && result.finalPlayers?.length > 0 && (
          <div style={{ background: "#f9fafb", borderRadius: 10, padding: 10 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#9ca3af", marginBottom: 6, textTransform: "uppercase" }}>
              Leaderboard
            </div>
            {result.finalPlayers.map((p, i) => (
              <div key={i} style={{
                display: "flex", alignItems: "center", gap: 8, padding: "6px 0",
                borderBottom: i < result.finalPlayers.length - 1 ? "1px solid #f3f4f6" : "none",
              }}>
                <span style={{ width: 24, fontSize: 13, fontWeight: 800, color: i === 0 ? "#f59e0b" : i === 1 ? "#6b7280" : "#f97316" }}>
                  {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `#${i + 1}`}
                </span>
                <span style={{ flex: 1, fontSize: 13, fontWeight: 600 }}>{p.inGameName}</span>
                <span style={{ fontSize: 12, color: "#6b7280" }}>{p.kills} kills</span>
                {p.prizeAwarded > 0 && <span style={{ fontSize: 12, fontWeight: 700, color: "#059669" }}>৳{p.prizeAwarded}</span>}
              </div>
            ))}
          </div>
        )}

        {result.status === "rejected" && result.adminNote && (
          <p style={{ fontSize: 12, color: "#dc2626", marginTop: 6 }}>কারণ: {result.adminNote}</p>
        )}

        <button
          onClick={checkResult}
          style={{ marginTop: 8, width: "100%", padding: "7px 0", background: "#f3f4f6", border: "none", borderRadius: 8, fontSize: 12, color: "#6b7280", cursor: "pointer", fontWeight: 600 }}
        >
          🔄 Status update করুন
        </button>
      </div>
    );
  }

  return (
    <div style={{ padding: "0 16px 16px", borderTop: "1px solid #f3f4f6", paddingTop: 12 }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: "#374151", marginBottom: 8 }}>
        📸 Result Screenshot Submit করুন
      </div>

      {preview && (
        <img src={preview} alt="" style={{ width: "100%", borderRadius: 8, maxHeight: 160, objectFit: "cover", marginBottom: 8 }} />
      )}

      {(status === "idle" || status === "error") && (
        <>
          <div
            onClick={() => fileRef.current.click()}
            style={{
              border: "2px dashed #d1d5db", borderRadius: 8, padding: "16px 12px",
              textAlign: "center", cursor: "pointer", background: "#fafafa", marginBottom: 8,
            }}
          >
            <div style={{ fontSize: 24 }}>📷</div>
            <p style={{ fontSize: 12, color: "#9ca3af", margin: "4px 0 0" }}>
              {file ? file.name : "Screenshot select করুন (Max 8MB)"}
            </p>
          </div>
          <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleFile} />
          {file && (
            <button
              onClick={handleUpload}
              style={{ width: "100%", padding: "11px 0", background: "#f97316", border: "none", borderRadius: 10, color: "#fff", fontWeight: 700, fontSize: 14, cursor: "pointer" }}
            >
              Submit করুন
            </button>
          )}
        </>
      )}

      {status === "uploading" && (
        <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "12px 0", color: "#6b7280", fontSize: 13 }}>
          <span style={{ display: "inline-block", animation: "spin 0.8s linear infinite", fontSize: 16 }}>⏳</span>
          Upload হচ্ছে...
        </div>
      )}

      {msg && (
        <p style={{ fontSize: 12, color: status === "error" ? "#dc2626" : "#059669", marginTop: 6 }}>{msg}</p>
      )}

      <style>{`@keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }`}</style>
    </div>
  );
};

// ── MyMatch Main Component ───────────────────────────────────────────────────
const MyMatch = ({ onBack }) => {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [openRoom, setOpenRoom]   = useState({});
  const [openPrize, setOpenPrize] = useState({});
  // ✅ NEW: copy feedback state
  const [copyMsg, setCopyMsg] = useState({});

  const user = (() => {
    try { return JSON.parse(localStorage.getItem("user") || "{}"); }
    catch { return {}; }
  })();
  const userId = user?.id || user?._id;
  const token  = localStorage.getItem("token");

  const load = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const res = await fetch(`${API}/matches/my-matches?userId=${userId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      const d = await res.json();
      setMatches(Array.isArray(d?.data) ? d.data : Array.isArray(d) ? d : []);
    } catch {
      setMatches([]);
    }
    setLoading(false);
  }, [userId]);

  useEffect(() => { load(); }, [load]);

  // ✅ Copy helper
  const copyToClipboard = (matchId, text, type) => {
    if (!text) return;
    navigator.clipboard.writeText(text).then(() => {
      setCopyMsg((prev) => ({ ...prev, [matchId + type]: true }));
      setTimeout(() => setCopyMsg((prev) => ({ ...prev, [matchId + type]: false })), 2000);
    });
  };

  const getSlot = (match) => {
    const entry = (match.joinedUsers || []).find(
      (u) => u.userId?.toString() === userId?.toString()
    );
    return entry?.slotNumber || "—";
  };

  const statusStyle = (s, started) => {
    if (s === "completed")      return { bg: "#f3f4f6", color: "#374151", label: "✅ Ended" };
    if (s === "live" || started) return { bg: "#d1fae5", color: "#065f46", label: "🟢 Live" };
    return { bg: "#dbeafe", color: "#1e40af", label: "🕐 Upcoming" };
  };

  if (!userId) {
    return (
      <div style={{ padding: 40, textAlign: "center" }}>
        <div style={{ fontSize: 40, marginBottom: 8 }}>🔒</div>
        <p style={{ color: "#9ca3af", fontSize: 14 }}>Login করুন</p>
      </div>
    );
  }

  return (
    <div style={{ background: "#f3f4f6", minHeight: "100vh", maxWidth: 450, margin: "0 auto", paddingBottom: 100 }}>

      {/* Header */}
      <div style={{
        background: "#fff", padding: "16px 18px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        borderBottom: "1px solid #e5e7eb", position: "sticky", top: 0, zIndex: 10,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {onBack && (
            <button
              onClick={onBack}
              style={{
                background: "#f3f4f6", border: "none", borderRadius: "50%",
                width: 36, height: 36, display: "flex", alignItems: "center",
                justifyContent: "center", fontSize: 18, cursor: "pointer",
                color: "#374151", flexShrink: 0,
              }}
            >←</button>
          )}
          <div style={{ fontSize: 18, fontWeight: 800, color: "#111827" }}>🎮 My Matches</div>
        </div>
        <button
          onClick={load}
          disabled={loading}
          style={{
            display: "flex", alignItems: "center", gap: 5,
            padding: "8px 16px",
            background: loading ? "#f3f4f6" : "#dbeafe",
            border: "none", borderRadius: 20, fontSize: 13,
            color: loading ? "#9ca3af" : "#1e40af",
            cursor: loading ? "not-allowed" : "pointer",
            fontWeight: 700,
          }}
        >
          <span style={{ display: "inline-block", animation: loading ? "spin 1s linear infinite" : "none" }}>🔄</span>
          {loading ? "Loading..." : "Refresh"}
        </button>
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
      `}</style>

      <div style={{ padding: "8px 8px 0" }}>

        {loading && matches.length === 0 && (
          <div style={{ textAlign: "center", padding: 40 }}>
            <div style={{ fontSize: 32, animation: "spin 1s linear infinite", display: "inline-block" }}>⏳</div>
            <p style={{ color: "#9ca3af", fontSize: 13, marginTop: 8 }}>Loading...</p>
          </div>
        )}

        {!loading && matches.length === 0 && (
          <div style={{ textAlign: "center", padding: "60px 20px" }}>
            <div style={{ fontSize: 52, marginBottom: 12 }}>🎮</div>
            <div style={{ fontSize: 15, fontWeight: 600, color: "#374151", marginBottom: 6 }}>কোনো match join করা হয়নি</div>
            <div style={{ fontSize: 13, color: "#9ca3af" }}>Match join করলে এখানে দেখা যাবে</div>
          </div>
        )}

        {matches.map((m) => {
          const started = m.startTime ? new Date(m.startTime).getTime() <= Date.now() : false;
          const st      = statusStyle(m.status, started);
          const joined  = Number(m.joinedPlayers || 0);
          const total   = Number(m.totalPlayers || 0);
          const fill    = total > 0 ? (joined / total) * 100 : 0;
          const slotNo  = getSlot(m);

          return (
            <div key={m._id} style={{
              background: "#fff", borderRadius: 16,
              boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
              overflow: "hidden", marginBottom: 16, paddingTop: 4,
            }}>

              {/* Top: image + title */}
              <div style={{ display: "flex", gap: 14, padding: "16px 16px 12px" }}>
                <img
                  src={m.image || "/image/img-1.jpg"}
                  alt=""
                  style={{ width: 105, height: 78, borderRadius: 10, objectFit: "cover", flexShrink: 0 }}
                  onError={(e) => { e.target.src = "/image/img-1.jpg"; }}
                />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 16, fontWeight: 800, color: "#111", lineHeight: 1.35 }}>
                    {m.title} | {m.device || "Mobile"}
                  </div>
                  <div style={{ fontSize: 13, color: "#e53935", marginTop: 5, fontWeight: 600 }}>
                    {m.startTime
                      ? new Date(m.startTime).toLocaleString("en-BD", {
                          day: "2-digit", month: "short", year: "numeric",
                          hour: "2-digit", minute: "2-digit", hour12: true,
                        })
                      : "—"}
                  </div>
                  <div style={{ marginTop: 7, display: "flex", gap: 6, flexWrap: "wrap" }}>
                    <span style={{ background: st.bg, color: st.color, fontSize: 11, padding: "3px 10px", borderRadius: 20, fontWeight: 700 }}>
                      {st.label}
                    </span>
                    {slotNo !== "—" && (
                      <span style={{ background: "#fef3c7", color: "#92400e", fontSize: 11, padding: "3px 10px", borderRadius: 20, fontWeight: 700 }}>
                        Slot #{slotNo}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Stats Grid */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", padding: "0 16px", rowGap: 14, marginBottom: 14 }}>
                {[
                  { label: "WIN PRIZE",  value: fmt(m.winPrize) },
                  { label: "ENTRY TYPE", value: (m.category || "").toUpperCase() },
                  { label: "ENTRY FEE",  value: fmt(m.entryFee) },
                  { label: "PER KILL",   value: fmt(m.perKill || 0) },
                  { label: "MAP",        value: m.map || "Bermuda" },
                  { label: "VERSION",    value: (m.device || "MOBILE").toUpperCase() },
                ].map((s, i) => (
                  <div key={i} style={{ textAlign: i % 3 === 0 ? "left" : i % 3 === 1 ? "center" : "right" }}>
                    <div style={{ fontSize: 10, color: "#777", fontWeight: 700, letterSpacing: 0.5 }}>{s.label}</div>
                    <div style={{ fontSize: 16, fontWeight: 800, color: "#111", marginTop: 3 }}>{s.value}</div>
                  </div>
                ))}
              </div>

              {/* Progress Bar */}
              <div style={{ padding: "0 16px 14px" }}>
                <div style={{ height: 10, background: "#e5e7eb", borderRadius: 20, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${fill}%`, background: "#22c55e", borderRadius: 20, transition: "width 0.5s" }} />
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: 5 }}>
                  <span style={{ fontSize: 11, color: "#6b7280" }}>Only {total - joined} spots left</span>
                  <span style={{ fontSize: 11, color: "#6b7280" }}>{joined}/{total}</span>
                </div>
              </div>

              {/* Room + Prize Buttons */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, padding: "0 16px 14px" }}>

                {/* Room Details */}
                <div>
                  <button
                    onClick={() => setOpenRoom((p) => ({ ...p, [m._id]: !p[m._id] }))}
                    style={{
                      width: "100%", padding: "12px 0", border: "1.5px solid #1e40af",
                      borderRadius: 10, background: "#fff", color: "#1e40af",
                      fontWeight: 700, fontSize: 13, cursor: "pointer",
                      display: "flex", alignItems: "center", justifyContent: "center", gap: 4,
                    }}
                  >
                    🔑 Room Details {openRoom[m._id] ? "▲" : "▼"}
                  </button>

                  {openRoom[m._id] && (
                    <div style={{ marginTop: 6, background: "#f0f9ff", borderRadius: 8, padding: "12px", border: "1px solid #bae6fd" }}>
                      {m.isRoomOpen && m.roomId ? (
                        <>
                          {/* ✅ Room ID + Copy Button */}
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                            <div style={{ fontSize: 13, color: "#0c4a6e" }}>
                              <b>Room ID:</b>{" "}
                              <span style={{ letterSpacing: 1, fontFamily: "monospace" }}>{m.roomId}</span>
                            </div>
                            <button
                              onClick={() => copyToClipboard(m._id, m.roomId, "room")}
                              style={{
                                padding: "4px 10px", background: copyMsg[m._id + "room"] ? "#16a34a" : "#1e40af",
                                color: "#fff", border: "none", borderRadius: 6,
                                fontSize: 11, cursor: "pointer", fontWeight: 700,
                                flexShrink: 0, marginLeft: 6, transition: "background 0.2s",
                              }}
                            >
                              {copyMsg[m._id + "room"] ? "✅ Copied" : "📋 Copy"}
                            </button>
                          </div>

                          {/* ✅ Password + Copy Button */}
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <div style={{ fontSize: 13, color: "#0c4a6e" }}>
                              <b>Password:</b>{" "}
                              <span style={{ letterSpacing: 1, fontFamily: "monospace" }}>{m.roomPassword || "—"}</span>
                            </div>
                            {m.roomPassword && (
                              <button
                                onClick={() => copyToClipboard(m._id, m.roomPassword, "pass")}
                                style={{
                                  padding: "4px 10px", background: copyMsg[m._id + "pass"] ? "#16a34a" : "#1e40af",
                                  color: "#fff", border: "none", borderRadius: 6,
                                  fontSize: 11, cursor: "pointer", fontWeight: 700,
                                  flexShrink: 0, marginLeft: 6, transition: "background 0.2s",
                                }}
                              >
                                {copyMsg[m._id + "pass"] ? "✅ Copied" : "📋 Copy"}
                              </button>
                            )}
                          </div>
                        </>
                      ) : (
                        <div style={{ fontSize: 12, color: "#64748b", textAlign: "center" }}>
                          ⏳ Room details not available yet
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Prize Details */}
                <div>
                  <button
                    onClick={() => setOpenPrize((p) => ({ ...p, [m._id]: !p[m._id] }))}
                    style={{
                      width: "100%", padding: "12px 0", border: "1.5px solid #1e40af",
                      borderRadius: 10, background: "#fff", color: "#1e40af",
                      fontWeight: 700, fontSize: 13, cursor: "pointer",
                      display: "flex", alignItems: "center", justifyContent: "center", gap: 4,
                    }}
                  >
                    🏆 Prize Details {openPrize[m._id] ? "▲" : "▼"}
                  </button>

                  {openPrize[m._id] && (
                    <div style={{ marginTop: 6, background: "#fefce8", borderRadius: 8, padding: "12px", border: "1px solid #fde68a" }}>
                      {[
                        { label: "🥇 1st Prize", value: m.prizes?.first  || m.winPrize || 0 },
                        { label: "🥈 2nd Prize", value: m.prizes?.second || 0 },
                        { label: "🥉 3rd Prize", value: m.prizes?.third  || 0 },
                        { label: "4️⃣ 4th Prize", value: m.prizes?.fourth || 0 },
                        { label: "🔫 Per Kill",  value: m.perKill || 0 },
                        { label: "🎟 Entry Fee", value: m.entryFee || 0 },
                      ].map((p, i) => (
                        <div key={i} style={{
                          display: "flex", justifyContent: "space-between",
                          fontSize: 13, color: "#92400e",
                          paddingBottom: 5, marginBottom: 5,
                          borderBottom: i < 5 ? "1px solid #fde68a" : "none",
                        }}>
                          <span>{p.label}</span>
                          <b>৳{p.value}</b>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Screenshot Upload */}
              {(started || m.status === "live" || m.status === "completed") && token && (
                <ScreenshotUpload matchId={m._id} />
              )}

              {/* Footer */}
              <div style={{
                background: m.status === "completed" ? "#374151" : "#16a34a",
                padding: "14px", textAlign: "center",
                color: "#fff", fontWeight: 700, fontSize: 14,
              }}>
                {m.status === "completed" ? (
                  <span>✅ Match শেষ হয়েছে</span>
                ) : started ? (
                  <span>কাস্টম Ready 🔑 Room Details থেকে নিন</span>
                ) : (
                  <span>⏰ STARTS IN — <TimeLeft startTime={m.startTime} /></span>
                )}
              </div>

            </div>
          );
        })}
      </div>
    </div>
  );
};

export default MyMatch;