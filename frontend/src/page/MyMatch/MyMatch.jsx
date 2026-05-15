 import React, { useState, useEffect, useCallback } from "react";
 
 const API = "https://playzo-vn8e.onrender.com/api";
 
 const fmt = (n) => "৳" + Number(n || 0).toLocaleString();
 
 // ── Countdown Timer ──
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
 
 const MyMatch = () => {
   const [matches, setMatches] = useState([]);
   const [loading, setLoading] = useState(false);
   const [openRoom, setOpenRoom] = useState({});
   const [openPrize, setOpenPrize] = useState({});
 
   // user ID localStorage থেকে
   const user = (() => {
     try { return JSON.parse(localStorage.getItem("user") || "{}"); }
     catch { return {}; }
   })();
   const userId = user?.id || user?._id;
 
   const load = useCallback(async () => {
     if (!userId) return;
     setLoading(true);
     try {
       // ✅ query parameter দিয়ে call — matchRoutes এর সাথে match করছে
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
 
   // ── slot number বের করা ──
   const getSlot = (match) => {
     const entry = (match.joinedUsers || []).find(
       (u) => u.userId?.toString() === userId?.toString()
     );
     return entry?.slotNumber || "—";
   };
 
   const statusStyle = (s) => {
     if (s === "live")      return { bg: "#d1fae5", color: "#065f46", label: "🟢 Live" };
     if (s === "completed") return { bg: "#f3f4f6", color: "#374151", label: "✅ Ended" };
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
 
       {/* ── Header ── */}
       <div style={{
         background: "#fff", padding: "14px 16px",
         display: "flex", alignItems: "center", justifyContent: "space-between",
         borderBottom: "1px solid #e5e7eb", position: "sticky", top: 0, zIndex: 10,
       }}>
         <div style={{ fontSize: 16, fontWeight: 700, color: "#111827" }}>🎮 My Matches</div>
         <button
           onClick={load}
           disabled={loading}
           style={{
             display: "flex", alignItems: "center", gap: 5,
             padding: "6px 14px",
             background: loading ? "#f3f4f6" : "#dbeafe",
             border: "none", borderRadius: 20, fontSize: 12,
             color: loading ? "#9ca3af" : "#1e40af",
             cursor: loading ? "not-allowed" : "pointer",
             fontWeight: 600,
           }}>
           <span style={{
             display: "inline-block",
             animation: loading ? "spin 1s linear infinite" : "none",
           }}>🔄</span>
           {loading ? "Loading..." : "Refresh"}
         </button>
       </div>
 
       <style>{`
         @keyframes spin {
           from { transform: rotate(0deg); }
           to   { transform: rotate(360deg); }
         }
       `}</style>
 
       {/* ── Content ── */}
       <div style={{ padding: "12px 12px 0" }}>
 
         {/* Loading */}
         {loading && matches.length === 0 && (
           <div style={{ textAlign: "center", padding: 40 }}>
             <div style={{ fontSize: 32, animation: "spin 1s linear infinite", display: "inline-block" }}>⏳</div>
             <p style={{ color: "#9ca3af", fontSize: 13, marginTop: 8 }}>Loading...</p>
           </div>
         )}
 
         {/* Empty State */}
         {!loading && matches.length === 0 && (
           <div style={{ textAlign: "center", padding: "60px 20px" }}>
             <div style={{ fontSize: 52, marginBottom: 12 }}>🎮</div>
             <div style={{ fontSize: 15, fontWeight: 600, color: "#374151", marginBottom: 6 }}>
               কোনো match join করা হয়নি
             </div>
             <div style={{ fontSize: 13, color: "#9ca3af" }}>
               Match join করলে এখানে দেখা যাবে
             </div>
           </div>
         )}
 
         {/* Match Cards */}
         {matches.map((m) => {
           const st = statusStyle(m.status);
           const joined = Number(m.joinedPlayers || 0);
           const total  = Number(m.totalPlayers || 0);
           const fill   = total > 0 ? (joined / total) * 100 : 0;
           const started = new Date(m.startTime).getTime() <= Date.now();
           const slotNo  = getSlot(m);
 
           return (
             <div key={m._id} style={{
               background: "#fff", borderRadius: 16,
               boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
               overflow: "hidden", marginBottom: 14,
             }}>
 
               {/* ── Top: image + title ── */}
               <div style={{ display: "flex", gap: 12, padding: "14px 14px 10px" }}>
                 <img
                   src={m.image || "/image/img-1.jpg"}
                   alt=""
                   style={{ width: 76, height: 58, borderRadius: 8, objectFit: "cover", flexShrink: 0 }}
                   onError={(e) => { e.target.src = "/image/img-1.jpg"; }}
                 />
                 <div style={{ flex: 1 }}>
                   <div style={{ fontSize: 14, fontWeight: 700, color: "#111", lineHeight: 1.3 }}>
                     {m.title} | {m.device || "Mobile"} | Regular
                   </div>
                   <div style={{ fontSize: 11, color: "#e53935", marginTop: 3, fontWeight: 500 }}>
                     {m.startTime
                       ? new Date(m.startTime).toLocaleString("en-BD", {
                           day: "2-digit", month: "short", year: "numeric",
                           hour: "2-digit", minute: "2-digit", hour12: true,
                         })
                       : "—"}
                   </div>
                   <div style={{ marginTop: 5, display: "flex", gap: 6, flexWrap: "wrap" }}>
                     <span style={{ background: st.bg, color: st.color, fontSize: 10, padding: "2px 8px", borderRadius: 20, fontWeight: 700 }}>
                       {st.label}
                     </span>
                     {slotNo !== "—" && (
                       <span style={{ background: "#fef3c7", color: "#92400e", fontSize: 10, padding: "2px 8px", borderRadius: 20, fontWeight: 700 }}>
                         Slot #{slotNo}
                       </span>
                     )}
                   </div>
                 </div>
               </div>
 
               {/* ── Stats Grid ── */}
               <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", padding: "0 14px", rowGap: 12, marginBottom: 12 }}>
                 {[
                   { label: "WIN PRIZE",  value: fmt(m.winPrize) },
                   { label: "ENTRY TYPE", value: (m.category || "").toUpperCase() },
                   { label: "ENTRY FEE",  value: fmt(m.entryFee) },
                   { label: "PER KILL",   value: fmt(m.perKill || 0) },
                   { label: "MAP",        value: m.map || "Bermuda" },
                   { label: "VERSION",    value: (m.device || "MOBILE").toUpperCase() },
                 ].map((s, i) => (
                   <div key={i} style={{ textAlign: i % 3 === 0 ? "left" : i % 3 === 1 ? "center" : "right" }}>
                     <div style={{ fontSize: 9, color: "#888", fontWeight: 600, letterSpacing: 0.5 }}>{s.label}</div>
                     <div style={{ fontSize: 14, fontWeight: 700, color: "#111", marginTop: 2 }}>{s.value}</div>
                   </div>
                 ))}
               </div>
 
               {/* ── Progress Bar ── */}
               <div style={{ padding: "0 14px 12px" }}>
                 <div style={{ height: 8, background: "#e5e7eb", borderRadius: 20, overflow: "hidden" }}>
                   <div style={{ height: "100%", width: `${fill}%`, background: "#22c55e", borderRadius: 20, transition: "width 0.5s" }} />
                 </div>
                 <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
                   <span style={{ fontSize: 10, color: "#6b7280" }}>Only {total - joined} spots left</span>
                   <span style={{ fontSize: 10, color: "#6b7280" }}>{joined}/{total}</span>
                 </div>
               </div>
 
               {/* ── Room + Prize Buttons ── */}
               <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, padding: "0 14px 12px" }}>
 
                 {/* Room Details */}
                 <div>
                   <button
                     onClick={() => setOpenRoom((p) => ({ ...p, [m._id]: !p[m._id] }))}
                     style={{
                       width: "100%", padding: "9px 0", border: "1.5px solid #1e40af",
                       borderRadius: 8, background: "#fff", color: "#1e40af",
                       fontWeight: 600, fontSize: 11, cursor: "pointer",
                       display: "flex", alignItems: "center", justifyContent: "center", gap: 4,
                     }}>
                     🔑 Room Details {openRoom[m._id] ? "▲" : "▼"}
                   </button>
                   {openRoom[m._id] && (
                     <div style={{ marginTop: 6, background: "#f0f9ff", borderRadius: 8, padding: "10px 12px", border: "1px solid #bae6fd" }}>
                       {m.isRoomOpen && m.roomId ? (
                         <>
                           <div style={{ fontSize: 12, color: "#0369a1", marginBottom: 4 }}>
                             <b>Room ID:</b> {m.roomId}
                           </div>
                           <div style={{ fontSize: 12, color: "#0369a1" }}>
                             <b>Password:</b> {m.roomPassword || "—"}
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
                       width: "100%", padding: "9px 0", border: "1.5px solid #1e40af",
                       borderRadius: 8, background: "#fff", color: "#1e40af",
                       fontWeight: 600, fontSize: 11, cursor: "pointer",
                       display: "flex", alignItems: "center", justifyContent: "center", gap: 4,
                     }}>
                     🏆 Prize Details {openPrize[m._id] ? "▲" : "▼"}
                   </button>
                   {openPrize[m._id] && (
                     <div style={{ marginTop: 6, background: "#fefce8", borderRadius: 8, padding: "10px 12px", border: "1px solid #fde68a" }}>
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
                           fontSize: 12, color: "#92400e",
                           paddingBottom: 4, marginBottom: 4,
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
 
               {/* ── Footer: countdown or started ── */}
               <div style={{
                 background: m.status === "completed" ? "#374151" : "#16a34a",
                 padding: "11px", textAlign: "center",
                 color: "#fff", fontWeight: 700, fontSize: 13,
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
 