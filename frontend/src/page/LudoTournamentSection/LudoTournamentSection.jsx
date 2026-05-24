 // src/Component/Ludo/LudoTournamentSection.jsx
 import React, { useState, useEffect, useCallback } from "react";
 
 const API = import.meta.env.VITE_API_URL || "https://playzo-vn8e.onrender.com";
 
 // ─── Countdown Timer ───────────────────────────────────────
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
 
 // ─── Mode Badge ────────────────────────────────────────────
 const ModeBadge = ({ mode }) => {
   const map = {
     "1v1":     { label: "⚔️ 1 vs 1",    bg: "#fef3c7", color: "#92400e" },
     "2v2":     { label: "👥 2 vs 2",    bg: "#dbeafe", color: "#1e40af" },
     "4player": { label: "🎮 4 Player",  bg: "#d1fae5", color: "#065f46" },
   };
   const s = map[mode] || map["4player"];
   return (
     <span style={{
       background: s.bg, color: s.color,
       fontSize: 10, padding: "3px 8px",
       borderRadius: 20, fontWeight: 800,
       letterSpacing: 0.3,
     }}>
       {s.label}
     </span>
   );
 };
 
 // ─── Status Badge ──────────────────────────────────────────
 const StatusBadge = ({ status }) => {
   const map = {
     upcoming:  { label: "🕐 Upcoming", bg: "#dbeafe", color: "#1e40af" },
     live:      { label: "🔴 Live",     bg: "#fee2e2", color: "#991b1b" },
     completed: { label: "✅ Ended",    bg: "#f3f4f6", color: "#374151" },
     cancelled: { label: "❌ Cancelled",bg: "#fef9c3", color: "#713f12" },
   };
   const s = map[status] || map.upcoming;
   return (
     <span style={{
       background: s.bg, color: s.color,
       fontSize: 10, padding: "3px 8px",
       borderRadius: 20, fontWeight: 700,
     }}>
       {s.label}
     </span>
   );
 };
 
 // ─── Single Match Card ─────────────────────────────────────
 const LudoCard = ({ match, userId, onJoin, joining }) => {
   const [showRoom, setShowRoom] = useState(false);
   const fmt    = (n) => "৳" + Number(n || 0).toLocaleString();
   const joined = Number(match.joinedPlayers || 0);
   const total  = Number(match.totalSlots  || match.totalPlayers || 4);
   const fill   = total > 0 ? (joined / total) * 100 : 0;
   const isMine = (match.joinedUsers || []).some(
     (u) => u.userId?.toString?.() === userId?.toString?.() ||
            u.userId === userId
   );
   const isFull = joined >= total;
   const canJoin = !isMine && !isFull &&
     match.status !== "completed" && match.status !== "cancelled";
 
   const mySlot = isMine
     ? (match.joinedUsers || []).find(
         (u) => u.userId?.toString?.() === userId?.toString?.() || u.userId === userId
       )?.slotNumber
     : null;
 
   return (
     <div style={{
       background: "#fff",
       borderRadius: 18,
       overflow: "hidden",
       boxShadow: "0 3px 14px rgba(0,0,0,0.07)",
       marginBottom: 14,
       border: isMine ? "2px solid #10b981" : "1px solid #f3f4f6",
       position: "relative",
     }}>
       {/* Ludo accent bar */}
       <div style={{
         height: 4,
         background: "linear-gradient(90deg, #f59e0b, #ef4444, #8b5cf6, #10b981)",
       }} />
 
       {/* Banner image */}
       {match.image && (
         <img
           src={match.image}
           alt=""
           style={{ width: "100%", height: 110, objectFit: "cover" }}
           onError={(e) => { e.target.style.display = "none"; }}
         />
       )}
 
       <div style={{ padding: "12px 14px" }}>
         {/* Header row */}
         <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
           <div>
             <div style={{ fontSize: 14, fontWeight: 800, color: "#111827", marginBottom: 4 }}>
               🎲 {match.title}
             </div>
             <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
               <ModeBadge mode={match.mode} />
               <StatusBadge status={match.status} />
               {isMine && (
                 <span style={{ background: "#d1fae5", color: "#065f46", fontSize: 10, padding: "3px 8px", borderRadius: 20, fontWeight: 700 }}>
                   ✅ Joined #{mySlot}
                 </span>
               )}
             </div>
           </div>
           {/* Prize pill */}
           <div style={{
             background: "linear-gradient(135deg, #fef3c7, #fde68a)",
             borderRadius: 12, padding: "6px 12px", textAlign: "center",
             border: "1px solid #fcd34d",
           }}>
             <div style={{ fontSize: 9, color: "#92400e", fontWeight: 700, marginBottom: 1 }}>WIN PRIZE</div>
             <div style={{ fontSize: 16, fontWeight: 900, color: "#b45309" }}>{fmt(match.winPrize)}</div>
           </div>
         </div>
 
         {/* Stats row */}
         <div style={{
           display: "grid", gridTemplateColumns: "1fr 1fr 1fr",
           background: "#f9fafb", borderRadius: 10, padding: "10px 0", marginBottom: 10,
         }}>
           {[
             { label: "Entry Fee", value: fmt(match.entryFee) },
             { label: "Players",   value: `${joined}/${total}` },
             { label: "Map",       value: match.map || "Classic" },
           ].map((s, i) => (
             <div key={i} style={{ textAlign: "center" }}>
               <div style={{ fontSize: 9, color: "#9ca3af", fontWeight: 700, textTransform: "uppercase", marginBottom: 2 }}>{s.label}</div>
               <div style={{ fontSize: 13, fontWeight: 800, color: "#111827" }}>{s.value}</div>
             </div>
           ))}
         </div>
 
         {/* Progress bar */}
         <div style={{ marginBottom: 10 }}>
           <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
             <span style={{ fontSize: 10, color: "#6b7280", fontWeight: 600 }}>Slots</span>
             <span style={{ fontSize: 10, fontWeight: 700, color: isFull ? "#ef4444" : "#059669" }}>
               {isFull ? "Full 🔒" : `${total - joined} বাকি`}
             </span>
           </div>
           <div style={{ height: 6, background: "#e5e7eb", borderRadius: 999 }}>
             <div style={{
               height: "100%",
               width: `${fill}%`,
               background: fill >= 100 ? "#ef4444" : fill >= 75 ? "#f59e0b" : "#10b981",
               borderRadius: 999, transition: "width 0.4s",
             }} />
           </div>
         </div>
 
         {/* Start time */}
         {match.startTime && (
           <div style={{ fontSize: 11, color: "#6b7280", marginBottom: 10, display: "flex", alignItems: "center", gap: 4 }}>
             ⏰
             {match.status === "upcoming"
               ? <><TimeLeft startTime={match.startTime} /> বাকি</>
               : new Date(match.startTime).toLocaleString("en-BD", {
                   day: "2-digit", month: "short",
                   hour: "2-digit", minute: "2-digit", hour12: true,
                 })
             }
           </div>
         )}
 
         {/* Prize breakdown */}
         {(match.prizes?.first > 0) && (
           <div style={{
             background: "#fefce8", borderRadius: 10, padding: "8px 10px",
             marginBottom: 10, border: "1px solid #fde68a",
           }}>
             <div style={{ fontSize: 10, fontWeight: 700, color: "#92400e", marginBottom: 5 }}>🏆 Prize Breakdown</div>
             <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
               {[
                 { rank: "🥇 1st", val: match.prizes.first },
                 { rank: "🥈 2nd", val: match.prizes.second },
                 { rank: "🥉 3rd", val: match.prizes.third },
                 match.mode === "4player" && { rank: "4️⃣ 4th", val: match.prizes.fourth },
               ].filter(Boolean).map((p, i) => p.val > 0 && (
                 <div key={i} style={{
                   background: "#fff", borderRadius: 8, padding: "4px 8px",
                   fontSize: 11, fontWeight: 700, color: "#b45309",
                   border: "1px solid #fde68a",
                 }}>
                   {p.rank} {fmt(p.val)}
                 </div>
               ))}
             </div>
           </div>
         )}
 
         {/* Room code (if joined and live) */}
         {isMine && match.status === "live" && match.roomCode && (
           <div style={{
             background: "#f0fdf4", borderRadius: 10, padding: "10px 12px",
             marginBottom: 10, border: "1px solid #86efac",
           }}>
             <div style={{ fontSize: 10, color: "#166534", fontWeight: 700, marginBottom: 4 }}>🎲 Room Code</div>
             <div style={{
               fontSize: 22, fontWeight: 900, letterSpacing: 4,
               color: "#15803d", textAlign: "center",
             }}>
               {showRoom ? match.roomCode : "••••••"}
             </div>
             <button
               onClick={() => setShowRoom(!showRoom)}
               style={{
                 marginTop: 6, width: "100%", background: "#16a34a",
                 color: "#fff", border: "none", borderRadius: 8,
                 padding: "6px 0", fontSize: 12, fontWeight: 700, cursor: "pointer",
               }}
             >
               {showRoom ? "🙈 লুকান" : "👁️ Room Code দেখুন"}
             </button>
           </div>
         )}
 
         {/* CTA Button */}
         {canJoin && (
           <button
             onClick={() => onJoin(match._id, match.entryFee, match.title)}
             disabled={joining === match._id}
             style={{
               width: "100%",
               background: joining === match._id
                 ? "#9ca3af"
                 : "linear-gradient(135deg, #f59e0b, #d97706)",
               color: "#fff", border: "none",
               borderRadius: 12, padding: "12px 0",
               fontSize: 14, fontWeight: 800,
               cursor: joining === match._id ? "not-allowed" : "pointer",
               boxShadow: "0 4px 12px rgba(245,158,11,0.35)",
               letterSpacing: 0.3,
             }}
           >
             {joining === match._id ? "⏳ Join হচ্ছে..." : `🎲 Join করুন — ${fmt(match.entryFee)}`}
           </button>
         )}
 
         {isMine && match.status === "upcoming" && (
           <div style={{
             background: "#d1fae5", borderRadius: 10, padding: "10px",
             textAlign: "center", fontSize: 12, fontWeight: 700, color: "#065f46",
           }}>
             ✅ আপনি join করেছেন! Match শুরু হলে Room Code দেখতে পাবেন।
           </div>
         )}
 
         {isFull && !isMine && (
           <div style={{
             background: "#fee2e2", borderRadius: 10, padding: "10px",
             textAlign: "center", fontSize: 12, fontWeight: 700, color: "#991b1b",
           }}>
             🔒 Match ফুল হয়ে গেছে
           </div>
         )}
       </div>
     </div>
   );
 };
 
 // ════════════════════════════════════════════════════════════
 // MAIN COMPONENT
 // ════════════════════════════════════════════════════════════
 const LudoTournamentSection = () => {
   const [activeMode, setActiveMode] = useState("all");
   const [matches, setMatches]       = useState([]);
   const [loading, setLoading]       = useState(false);
   const [joining, setJoining]       = useState(null);
   const [toast, setToast]           = useState({ text: "", type: "" });
 
   const user   = (() => { try { return JSON.parse(localStorage.getItem("user") || "{}"); } catch { return {}; } })();
   const userId = user?.id || user?._id;
   const token  = localStorage.getItem("token");
 
   const showToast = (text, type = "success") => {
     setToast({ text, type });
     setTimeout(() => setToast({ text: "", type: "" }), 3500);
   };
 
   const loadMatches = useCallback(async () => {
     setLoading(true);
     try {
       const q   = activeMode !== "all" ? `?mode=${activeMode}` : "";
       const res = await fetch(`${API}/api/ludo-tournament${q}`);
       const d   = await res.json();
       setMatches(Array.isArray(d?.data) ? d.data : []);
     } catch {
       setMatches([]);
     }
     setLoading(false);
   }, [activeMode]);
 
   useEffect(() => { loadMatches(); }, [loadMatches]);
 
   const handleJoin = async (matchId, entryFee, matchTitle) => {
     if (!userId) return showToast("আগে Login করুন", "error");
     if (!window.confirm(`"${matchTitle}" তে Join করবেন?\nEntry Fee: ৳${entryFee}`)) return;
 
     setJoining(matchId);
     try {
       const res = await fetch(`${API}/api/ludo-tournament/join/${matchId}`, {
         method: "PUT",
         headers: {
           "Content-Type": "application/json",
           Authorization: `Bearer ${token}`,
         },
         body: JSON.stringify({ userId }),
       });
       const d = await res.json();
       if (d.success) {
         showToast(`✅ Join সফল! Slot #${d.slotNumber}. নতুন Balance: ৳${d.newBalance}`);
         // Update localStorage balance
         const u = JSON.parse(localStorage.getItem("user") || "{}");
         localStorage.setItem("user", JSON.stringify({ ...u, balance: d.newBalance }));
         loadMatches();
       } else {
         showToast(d.message || "Join হয়নি", "error");
       }
     } catch {
       showToast("নেটওয়ার্ক সমস্যা", "error");
     }
     setJoining(null);
   };
 
   const modes = [
     { id: "all",     label: "🎲 সব",       count: matches.length },
     { id: "1v1",     label: "⚔️ 1 vs 1",   count: matches.filter(m => m.mode === "1v1").length },
     { id: "2v2",     label: "👥 2 vs 2",   count: matches.filter(m => m.mode === "2v2").length },
     { id: "4player", label: "🎮 4 Player", count: matches.filter(m => m.mode === "4player").length },
   ];
 
   const filtered = activeMode === "all" ? matches : matches.filter(m => m.mode === activeMode);
 
   return (
     <div style={{ background: "#f3f4f6", minHeight: "100%", paddingBottom: 20 }}>
 
       {/* Header */}
       <div style={{
         background: "linear-gradient(135deg, #7c3aed, #4f46e5)",
         padding: "18px 16px 14px",
       }}>
         <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
           <div>
             <div style={{ color: "#c4b5fd", fontSize: 11, fontWeight: 600, marginBottom: 2 }}>TOURNAMENT</div>
             <div style={{ color: "#fff", fontSize: 20, fontWeight: 900 }}>🎲 Ludo</div>
           </div>
           <button
             onClick={loadMatches}
             disabled={loading}
             style={{
               background: "rgba(255,255,255,0.15)", color: "#fff",
               border: "none", borderRadius: 20, padding: "6px 14px",
               fontSize: 12, fontWeight: 700, cursor: "pointer",
             }}
           >
             {loading ? "⏳" : "🔄 Refresh"}
           </button>
         </div>
 
         {/* Mode tabs */}
         <div style={{
           display: "flex", gap: 6, marginTop: 14,
           overflowX: "auto", paddingBottom: 2,
         }}>
           {modes.map((m) => (
             <button
               key={m.id}
               onClick={() => setActiveMode(m.id)}
               style={{
                 flexShrink: 0, padding: "7px 14px",
                 borderRadius: 20, border: "none", cursor: "pointer",
                 background: activeMode === m.id ? "#fff" : "rgba(255,255,255,0.15)",
                 color: activeMode === m.id ? "#4f46e5" : "#e0d7ff",
                 fontWeight: 700, fontSize: 12,
                 transition: "all 0.2s",
               }}
             >
               {m.label}
               {m.count > 0 && (
                 <span style={{
                   marginLeft: 4, background: activeMode === m.id ? "#4f46e5" : "rgba(255,255,255,0.3)",
                   color: "#fff", borderRadius: 999, padding: "0 5px",
                   fontSize: 10, fontWeight: 800,
                 }}>
                   {m.count}
                 </span>
               )}
             </button>
           ))}
         </div>
       </div>
 
       {/* Toast */}
       {toast.text && (
         <div style={{
           margin: "10px 12px 0",
           background: toast.type === "error" ? "#fee2e2" : "#d1fae5",
           color: toast.type === "error" ? "#991b1b" : "#065f46",
           padding: "10px 14px", borderRadius: 12, fontSize: 13, fontWeight: 600,
           border: `1px solid ${toast.type === "error" ? "#fca5a5" : "#6ee7b7"}`,
         }}>
           {toast.text}
         </div>
       )}
 
       {/* Cards */}
       <div style={{ padding: "12px 12px 0" }}>
         {loading && filtered.length === 0 && (
           <div style={{ textAlign: "center", padding: 50, color: "#9ca3af" }}>
             <div style={{ fontSize: 40 }}>🎲</div>
             <p style={{ marginTop: 8, fontSize: 13 }}>লোড হচ্ছে...</p>
           </div>
         )}
 
         {!loading && filtered.length === 0 && (
           <div style={{
             textAlign: "center", padding: "50px 20px",
             background: "#fff", borderRadius: 16,
             boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
           }}>
             <div style={{ fontSize: 52, marginBottom: 10 }}>🎲</div>
             <div style={{ fontSize: 15, fontWeight: 700, color: "#374151", marginBottom: 6 }}>
               কোনো match নেই
             </div>
             <div style={{ fontSize: 13, color: "#9ca3af" }}>
               এই mode-এ এখন কোনো tournament নেই। পরে আসুন।
             </div>
           </div>
         )}
 
         {filtered.map((m) => (
           <LudoCard
             key={m._id}
             match={m}
             userId={userId}
             onJoin={handleJoin}
             joining={joining}
           />
         ))}
       </div>
     </div>
   );
 };
 
 export default LudoTournamentSection;
 