 // src/Component/Admin/LudoTournamentManager.jsx
 import React, { useState, useEffect, useCallback } from "react";
 
 const API = import.meta.env.VITE_API_URL || "https://playzo-vn8e.onrender.com";
 
 const token = () =>
   localStorage.getItem("adminToken") ||
   localStorage.getItem("token") ||
   "";
 
 const api = async (path, opts = {}) => {
   const res = await fetch(`${API}/api${path}`, {
     headers: { "Content-Type": "application/json", Authorization: `Bearer ${token()}` },
     ...opts,
   });
   return res.json();
 };
 
 const fmt = (n) => "৳" + Number(n || 0).toLocaleString();
 
 const inp = {
   width: "100%", boxSizing: "border-box",
   padding: "10px 12px", border: "1.5px solid #e5e7eb",
   borderRadius: 10, fontSize: 13, background: "#f9fafb",
   outline: "none", fontFamily: "inherit",
 };
 
 const LUDO_MAPS = ["Classic", "Quick Ludo", "Arrow", "Magic"];
 const MODES     = [
   { id: "1v1",     label: "⚔️ 1 vs 1 (2 জন)",     slots: 2 },
   { id: "2v2",     label: "👥 2 vs 2 (4 জন)",     slots: 4 },
   { id: "4player", label: "🎮 4 Player Solo",       slots: 4 },
 ];
 
 // ─── Create Form ───────────────────────────────────────────
 const CreateLudoForm = ({ onCreated }) => {
   const [form, setForm] = useState({
     title: "", mode: "4player",
     entryFee: "", winPrize: "",
     startTime: "", map: "Classic", device: "Mobile", image: "",
     prizes: { first: "", second: "", third: "", fourth: "" },
   });
   const [msg, setMsg] = useState("");
 
   const f  = (key)    => ({ style: inp, value: form[key] || "", onChange: (e) => setForm(p => ({ ...p, [key]: e.target.value })) });
   const fp = (key)    => ({ style: inp, value: form.prizes[key] || "", onChange: (e) => setForm(p => ({ ...p, prizes: { ...p.prizes, [key]: e.target.value } })) });
 
   const handleImage = (e) => {
     const file = e.target.files?.[0];
     if (!file) return;
     const reader = new FileReader();
     reader.onload = (ev) => setForm(p => ({ ...p, image: ev.target.result }));
     reader.readAsDataURL(file);
   };
 
   const submit = async () => {
     if (!form.title || !form.startTime) { setMsg("❌ Title ও Start Time দিন"); return; }
     const payload = {
       ...form,
       entryFee: Number(form.entryFee || 0),
       winPrize: Number(form.winPrize || 0),
       prizes: {
         first:  Number(form.prizes.first  || 0),
         second: Number(form.prizes.second || 0),
         third:  Number(form.prizes.third  || 0),
         fourth: Number(form.prizes.fourth || 0),
       },
     };
     const d = await api("/ludo-tournament/create", { method: "POST", body: JSON.stringify(payload) });
     if (d.success) {
       setMsg("✅ Ludo tournament created!");
       setForm({ title: "", mode: "4player", entryFee: "", winPrize: "", startTime: "", map: "Classic", device: "Mobile", image: "", prizes: { first: "", second: "", third: "", fourth: "" } });
       onCreated?.();
     } else {
       setMsg("❌ " + d.message);
     }
   };
 
   return (
     <div style={{ background: "#fff", borderRadius: 14, padding: 20, border: "1px solid #e5e7eb" }}>
       <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 18, color: "#111" }}>🎲 নতুন Ludo Tournament</div>
 
       <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
         {/* Title */}
         <div>
           <div style={{ fontSize: 11, color: "#6b7280", marginBottom: 4, fontWeight: 600 }}>Match Title *</div>
           <input placeholder="যেমন: Ludo Solo #1" {...f("title")} />
         </div>
 
         {/* Mode */}
         <div>
           <div style={{ fontSize: 11, color: "#6b7280", marginBottom: 6, fontWeight: 600 }}>Tournament Mode</div>
           <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
             {MODES.map((m) => (
               <button
                 key={m.id}
                 onClick={() => setForm(p => ({ ...p, mode: m.id }))}
                 style={{
                   padding: "10px 8px", borderRadius: 10, cursor: "pointer",
                   border: `2px solid ${form.mode === m.id ? "#7c3aed" : "#e5e7eb"}`,
                   background: form.mode === m.id ? "#ede9fe" : "#fff",
                   color: form.mode === m.id ? "#5b21b6" : "#6b7280",
                   fontSize: 11, fontWeight: 700, textAlign: "center",
                 }}
               >
                 {m.label}
               </button>
             ))}
           </div>
         </div>
 
         {/* Start Time */}
         <div>
           <div style={{ fontSize: 11, color: "#6b7280", marginBottom: 4, fontWeight: 600 }}>Start Time *</div>
           <input type="datetime-local" {...f("startTime")} />
         </div>
 
         {/* Entry & Prize */}
         <div>
           <div style={{ fontSize: 11, color: "#6b7280", marginBottom: 6, fontWeight: 600 }}>Entry & Prize</div>
           <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
             <input placeholder="Entry Fee (৳)" {...f("entryFee")} type="number" style={inp} />
             <input placeholder="Win Prize (৳)" {...f("winPrize")} type="number" style={inp} />
           </div>
         </div>
 
         {/* Prize Breakdown */}
         <div style={{ background: "#fefce8", border: "1px solid #fde68a", borderRadius: 10, padding: 14 }}>
           <div style={{ fontSize: 12, fontWeight: 700, color: "#92400e", marginBottom: 10 }}>🏆 Prize Breakdown</div>
           <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
             <div><div style={{ fontSize: 10, color: "#92400e", marginBottom: 3 }}>🥇 1st Prize (৳)</div><input placeholder="0" {...fp("first")} type="number" style={{ ...inp, background: "#fff" }} /></div>
             <div><div style={{ fontSize: 10, color: "#92400e", marginBottom: 3 }}>🥈 2nd Prize (৳)</div><input placeholder="0" {...fp("second")} type="number" style={{ ...inp, background: "#fff" }} /></div>
             <div><div style={{ fontSize: 10, color: "#92400e", marginBottom: 3 }}>🥉 3rd Prize (৳)</div><input placeholder="0" {...fp("third")} type="number" style={{ ...inp, background: "#fff" }} /></div>
             {form.mode === "4player" && (
               <div><div style={{ fontSize: 10, color: "#92400e", marginBottom: 3 }}>4️⃣ 4th Prize (৳)</div><input placeholder="0" {...fp("fourth")} type="number" style={{ ...inp, background: "#fff" }} /></div>
             )}
           </div>
         </div>
 
         {/* Map & Device */}
         <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
           <div>
             <div style={{ fontSize: 11, color: "#6b7280", marginBottom: 4, fontWeight: 600 }}>Map</div>
             <select style={inp} value={form.map} onChange={(e) => setForm(p => ({ ...p, map: e.target.value }))}>
               {LUDO_MAPS.map(m => <option key={m} value={m}>{m}</option>)}
             </select>
           </div>
           <div>
             <div style={{ fontSize: 11, color: "#6b7280", marginBottom: 4, fontWeight: 600 }}>Device</div>
             <select style={inp} value={form.device} onChange={(e) => setForm(p => ({ ...p, device: e.target.value }))}>
               <option value="Mobile">Mobile</option>
               <option value="Emulator">Emulator</option>
               <option value="All">All Device</option>
             </select>
           </div>
         </div>
 
         {/* Image */}
         <div>
           <div style={{ fontSize: 11, color: "#6b7280", marginBottom: 4, fontWeight: 600 }}>Match Banner</div>
           <label style={{ display: "block", padding: 12, border: "1.5px dashed #d1d5db", borderRadius: 8, textAlign: "center", cursor: "pointer", fontSize: 13, color: "#6b7280", background: "#f9fafb" }}>
             📷 Image Upload
             <input type="file" accept="image/*" onChange={handleImage} style={{ display: "none" }} />
           </label>
           {form.image && (
             <div style={{ marginTop: 8, position: "relative" }}>
               <img src={form.image} alt="" style={{ width: "100%", height: 100, objectFit: "cover", borderRadius: 8 }} />
               <button onClick={() => setForm(p => ({ ...p, image: "" }))} style={{ position: "absolute", top: 6, right: 6, background: "#ef4444", color: "#fff", border: "none", borderRadius: 6, padding: "2px 8px", fontSize: 11, cursor: "pointer" }}>✕</button>
             </div>
           )}
         </div>
 
         {msg && (
           <div style={{ fontSize: 12, padding: "8px 10px", borderRadius: 8, background: msg.startsWith("✅") ? "#d1fae5" : "#fee2e2", color: msg.startsWith("✅") ? "#065f46" : "#dc2626" }}>{msg}</div>
         )}
 
         <button onClick={submit} style={{ padding: 12, background: "linear-gradient(135deg, #7c3aed, #4f46e5)", color: "#fff", border: "none", borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: "pointer" }}>
           🎲 Create Ludo Tournament
         </button>
       </div>
     </div>
   );
 };
 
 // ─── Match Row ─────────────────────────────────────────────
 const MatchRow = ({ match, onRefresh }) => {
   const [roomCode, setRoomCode]   = useState(match.roomCode || "");
   const [showResult, setShowResult] = useState(false);
   const [results, setResults]     = useState(
     (match.joinedUsers || []).map((u) => ({
       userId: u.userId?._id || u.userId,
       name: u.userId?.name || "",
       rank: "", prize: 0, kills: 0,
     }))
   );
   const [msg, setMsg] = useState("");
 
   const modeColors = { "1v1": "#f59e0b", "2v2": "#3b82f6", "4player": "#10b981" };
   const modeColor  = modeColors[match.mode] || "#6b7280";
 
   const updateRoom = async () => {
     if (!roomCode) return;
     const d = await api(`/ludo-tournament/update-room/${match._id}`, {
       method: "PUT", body: JSON.stringify({ roomCode }),
     });
     setMsg(d.success ? "✅ Room code set, match is LIVE" : "❌ " + d.message);
     onRefresh();
   };
 
   const submitResult = async () => {
     const filled = results.filter(r => r.rank && r.userId);
     if (!filled.length) { setMsg("❌ অন্তত একজনের result দিন"); return; }
     const d = await api(`/ludo-tournament/result/${match._id}`, {
       method: "POST",
       body: JSON.stringify({ results: filled.map(r => ({ ...r, rank: Number(r.rank), prize: Number(r.prize), kills: Number(r.kills || 0) })) }),
     });
     setMsg(d.success ? "✅ Result submitted & prizes sent!" : "❌ " + d.message);
     onRefresh();
   };
 
   const deleteMatch = async () => {
     if (!window.confirm("এই match delete করবেন?")) return;
     await api(`/ludo-tournament/${match._id}`, { method: "DELETE" });
     onRefresh();
   };
 
   const statusColors = { upcoming: "#dbeafe", live: "#fee2e2", completed: "#d1fae5", cancelled: "#f3f4f6" };
   const statusTextColors = { upcoming: "#1e40af", live: "#991b1b", completed: "#065f46", cancelled: "#374151" };
 
   return (
     <div style={{
       background: "#fff", borderRadius: 14, border: "1px solid #e5e7eb",
       overflow: "hidden", marginBottom: 12,
     }}>
       {/* Top bar with mode color */}
       <div style={{ height: 3, background: modeColor }} />
 
       <div style={{ padding: "14px 16px" }}>
         {/* Header */}
         <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
           <div>
             <div style={{ fontSize: 14, fontWeight: 700, color: "#111" }}>🎲 {match.title}</div>
             <div style={{ display: "flex", gap: 6, marginTop: 4, flexWrap: "wrap" }}>
               <span style={{ background: modeColor + "22", color: modeColor, fontSize: 10, padding: "2px 8px", borderRadius: 20, fontWeight: 700, border: `1px solid ${modeColor}55` }}>
                 {match.mode === "1v1" ? "⚔️ 1v1" : match.mode === "2v2" ? "👥 2v2" : "🎮 4Player"}
               </span>
               <span style={{ background: statusColors[match.status], color: statusTextColors[match.status], fontSize: 10, padding: "2px 8px", borderRadius: 20, fontWeight: 700 }}>
                 {match.status?.toUpperCase()}
               </span>
             </div>
           </div>
           <div style={{ textAlign: "right" }}>
             <div style={{ fontSize: 12, color: "#6b7280" }}>{fmt(match.entryFee)} entry</div>
             <div style={{ fontSize: 14, fontWeight: 700, color: "#f59e0b" }}>{fmt(match.winPrize)} prize</div>
           </div>
         </div>
 
         {/* Stats */}
         <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6, marginBottom: 12 }}>
           {[
             { label: "Joined", value: `${match.joinedPlayers || 0}/${match.totalSlots || 4}` },
             { label: "Map", value: match.map || "Classic" },
             { label: "Start", value: match.startTime ? new Date(match.startTime).toLocaleTimeString("en-BD", { hour: "2-digit", minute: "2-digit", hour12: true }) : "—" },
           ].map((s, i) => (
             <div key={i} style={{ background: "#f9fafb", borderRadius: 8, padding: "6px 8px", textAlign: "center" }}>
               <div style={{ fontSize: 9, color: "#9ca3af", fontWeight: 600, textTransform: "uppercase" }}>{s.label}</div>
               <div style={{ fontSize: 12, fontWeight: 700, color: "#111" }}>{s.value}</div>
             </div>
           ))}
         </div>
 
         {/* Room code update */}
         {match.status !== "completed" && match.status !== "cancelled" && (
           <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
             <input
               style={{ ...inp, flex: 1 }}
               placeholder="Room Code দিন..."
               value={roomCode}
               onChange={(e) => setRoomCode(e.target.value)}
             />
             <button
               onClick={updateRoom}
               style={{ padding: "10px 14px", background: "#4f46e5", color: "#fff", border: "none", borderRadius: 10, fontSize: 12, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" }}
             >
               Set Live 🚀
             </button>
           </div>
         )}
 
         {/* Result section toggle */}
         {match.status !== "completed" && match.joinedPlayers > 0 && (
           <button
             onClick={() => setShowResult(!showResult)}
             style={{ width: "100%", padding: "8px 0", background: showResult ? "#fef9c3" : "#f9fafb", color: "#374151", border: "1px solid #e5e7eb", borderRadius: 10, fontSize: 12, fontWeight: 700, cursor: "pointer", marginBottom: 8 }}
           >
             {showResult ? "🔼 Result বন্ধ করুন" : "🏆 Result দিন"}
           </button>
         )}
 
         {showResult && (
           <div style={{ background: "#f9fafb", borderRadius: 10, padding: 12, marginBottom: 8 }}>
             <div style={{ fontSize: 11, fontWeight: 700, color: "#374151", marginBottom: 8 }}>
               Players ({results.length} জন)
             </div>
             {results.map((r, i) => (
               <div key={i} style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: 6, marginBottom: 6 }}>
                 <div style={{ fontSize: 11, background: "#fff", borderRadius: 8, padding: "6px 8px", border: "1px solid #e5e7eb", fontWeight: 600, color: "#374151", display: "flex", alignItems: "center" }}>
                   {r.name || r.userId?.toString?.().slice(-6) || `Player ${i + 1}`}
                 </div>
                 <input
                   style={{ ...inp, fontSize: 11, padding: "6px 8px" }}
                   placeholder="Rank"
                   type="number"
                   value={r.rank}
                   onChange={(e) => setResults(prev => prev.map((p, j) => j === i ? { ...p, rank: e.target.value } : p))}
                 />
                 <input
                   style={{ ...inp, fontSize: 11, padding: "6px 8px" }}
                   placeholder="Prize ৳"
                   type="number"
                   value={r.prize}
                   onChange={(e) => setResults(prev => prev.map((p, j) => j === i ? { ...p, prize: e.target.value } : p))}
                 />
               </div>
             ))}
             <button
               onClick={submitResult}
               style={{ width: "100%", padding: 10, background: "#10b981", color: "#fff", border: "none", borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: "pointer", marginTop: 6 }}
             >
               ✅ Result Submit & Prize পাঠান
             </button>
           </div>
         )}
 
         {msg && (
           <div style={{ fontSize: 12, padding: "6px 10px", borderRadius: 8, background: msg.startsWith("✅") ? "#d1fae5" : "#fee2e2", color: msg.startsWith("✅") ? "#065f46" : "#dc2626", marginBottom: 8 }}>{msg}</div>
         )}
 
         {/* Delete */}
         <button
           onClick={deleteMatch}
           style={{ padding: "6px 12px", background: "#fff", color: "#ef4444", border: "1px solid #fca5a5", borderRadius: 8, fontSize: 11, fontWeight: 600, cursor: "pointer" }}
         >
           🗑️ Delete
         </button>
       </div>
     </div>
   );
 };
 
 // ════════════════════════════════════════════════════════════
 // MAIN ADMIN COMPONENT
 // ════════════════════════════════════════════════════════════
 const LudoTournamentManager = () => {
   const [tab, setTab]       = useState("list");
   const [matches, setMatches] = useState([]);
   const [filter, setFilter] = useState("all");
   const [loading, setLoading] = useState(false);
 
   const load = useCallback(async () => {
     setLoading(true);
     const d = await api("/ludo-tournament");
     setMatches(Array.isArray(d?.data) ? d.data : []);
     setLoading(false);
   }, []);
 
   useEffect(() => { load(); }, [load]);
 
   const filtered = filter === "all" ? matches : matches.filter(m => m.status === filter);
   const counts   = {
     all: matches.length,
     upcoming: matches.filter(m => m.status === "upcoming").length,
     live: matches.filter(m => m.status === "live").length,
     completed: matches.filter(m => m.status === "completed").length,
   };
 
   return (
     <div style={{ padding: 16, maxWidth: 700, margin: "0 auto" }}>
       {/* Page header */}
       <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
         <div>
           <div style={{ fontSize: 18, fontWeight: 800, color: "#111" }}>🎲 Ludo Tournaments</div>
           <div style={{ fontSize: 12, color: "#9ca3af", marginTop: 2 }}>Total: {matches.length}</div>
         </div>
         <div style={{ display: "flex", gap: 6 }}>
           <button
             onClick={() => setTab("create")}
             style={{ padding: "8px 14px", background: "linear-gradient(135deg, #7c3aed, #4f46e5)", color: "#fff", border: "none", borderRadius: 10, fontSize: 12, fontWeight: 700, cursor: "pointer" }}
           >
             + নতুন
           </button>
           <button
             onClick={load}
             style={{ padding: "8px 12px", background: "#f3f4f6", color: "#374151", border: "none", borderRadius: 10, fontSize: 12, fontWeight: 700, cursor: "pointer" }}
           >
             🔄
           </button>
         </div>
       </div>
 
       {/* Tabs */}
       <div style={{ display: "flex", gap: 4, marginBottom: 14, background: "#f9fafb", borderRadius: 12, padding: 4 }}>
         {[
           { id: "list",   label: "📋 List" },
           { id: "create", label: "➕ Create" },
         ].map((t) => (
           <button
             key={t.id}
             onClick={() => setTab(t.id)}
             style={{
               flex: 1, padding: "8px 0", border: "none", borderRadius: 9, cursor: "pointer",
               background: tab === t.id ? "#fff" : "transparent",
               color: tab === t.id ? "#4f46e5" : "#9ca3af",
               fontWeight: 700, fontSize: 13,
               boxShadow: tab === t.id ? "0 1px 4px rgba(0,0,0,0.08)" : "none",
             }}
           >
             {t.label}
           </button>
         ))}
       </div>
 
       {tab === "create" && (
         <CreateLudoForm onCreated={() => { load(); setTab("list"); }} />
       )}
 
       {tab === "list" && (
         <>
           {/* Status filter */}
           <div style={{ display: "flex", gap: 6, marginBottom: 12, overflowX: "auto" }}>
             {[
               { id: "all",       label: `সব (${counts.all})` },
               { id: "upcoming",  label: `🕐 Upcoming (${counts.upcoming})` },
               { id: "live",      label: `🔴 Live (${counts.live})` },
               { id: "completed", label: `✅ Done (${counts.completed})` },
             ].map((f) => (
               <button
                 key={f.id}
                 onClick={() => setFilter(f.id)}
                 style={{
                   flexShrink: 0, padding: "6px 12px",
                   borderRadius: 20, border: "none", cursor: "pointer",
                   background: filter === f.id ? "#4f46e5" : "#f3f4f6",
                   color: filter === f.id ? "#fff" : "#6b7280",
                   fontSize: 11, fontWeight: 700,
                 }}
               >
                 {f.label}
               </button>
             ))}
           </div>
 
           {loading && <div style={{ textAlign: "center", padding: 30, color: "#9ca3af" }}>Loading...</div>}
 
           {!loading && filtered.length === 0 && (
             <div style={{ textAlign: "center", padding: 40, background: "#fff", borderRadius: 14, border: "1px solid #e5e7eb" }}>
               <div style={{ fontSize: 40 }}>🎲</div>
               <div style={{ fontSize: 14, color: "#6b7280", marginTop: 8 }}>কোনো tournament নেই</div>
             </div>
           )}
 
           {filtered.map((m) => (
             <MatchRow key={m._id} match={m} onRefresh={load} />
           ))}
         </>
       )}
     </div>
   );
 };
 
 export default LudoTournamentManager;
 