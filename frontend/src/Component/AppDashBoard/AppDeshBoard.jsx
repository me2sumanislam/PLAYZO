 import React, { useState, useEffect } from "react";
 import BottomMenu from "../BottomMenu/BottomMenu";
 import Profile from "../../page/Profile/profile";
 import Wallet from "../../page/Wallet/Wallet";
 import MatchList from "../../page/MatchList/MatchList";
 import MatchJoin from "../../page/MatchJoin/MatchJoin";
 import AdminDashboard from "../../Component/AppDashBoard/AppDeshBoard";
 
 const AppDashboard = ({ onLogout }) => {
   const [tab, setTab]                     = useState("play");
   const [screen, setScreen]               = useState("home");
   const [slide, setSlide]                 = useState(0);
   const [selectedCategory, setSelectedCategory] = useState("");
   const [selectedMatch, setSelectedMatch] = useState(null);
   const [matches, setMatches]             = useState([]);
 
   // ================= LOAD MATCHES =================
   useEffect(() => {
     const loadMatches = async () => {
       try {
         const res  = await fetch("http://localhost:5000/api/matches");
         const data = await res.json();
 
         let safeData = [];
         if (Array.isArray(data))              safeData = data;
         else if (Array.isArray(data?.matches)) safeData = data.matches;
         else if (Array.isArray(data?.data))    safeData = data.data;
 
         setMatches(safeData);
       } catch (err) {
         console.log("MATCH LOAD ERROR:", err);
         setMatches([]);
       }
     };
     loadMatches();
   }, []);
 
   // ================= SLIDER =================
   useEffect(() => {
     const timer = setInterval(() => {
       setSlide((p) => (p === 2 ? 0 : p + 1));
     }, 3000);
     return () => clearInterval(timer);
   }, []);
 
   const categories = [
     { key: "solo",       title: "SOLO",       img: "/image/img-1.jpg" },
     { key: "duo",        title: "DUO",        img: "/image/img-2.jpg" },
     { key: "squad",      title: "SQUAD",      img: "/image/img-3.jpg" },
     { key: "cs",         title: "CS",         img: "/image/img-1.jpg" },
     { key: "custom",     title: "CUSTOM",     img: "/image/img-2.jpg" },
     { key: "tournament", title: "TOURNAMENT", img: "/image/img-3.jpg" },
   ];
 
   const filteredMatches = matches.filter(
     (m) =>
       (m.category || "").toLowerCase().trim() ===
       selectedCategory.toLowerCase().trim()
   );
 
   // ================= ADMIN PANEL =================
   // যেকোনো tab থেকে admin খুললে এটা আসবে
   if (screen === "admin") {
     return (
       <AdminDashboard onBack={() => setScreen("home")} />
     );
   }
 
   // ================= PROFILE TAB =================
   if (tab === "profile") {
 
     if (screen === "wallet") {
       return (
         <div className="bg-white min-h-screen max-w-[450px] mx-auto pb-24">
           <Wallet onBack={() => setScreen("home")} />
           <BottomMenu tab={tab} setTab={setTab} />
         </div>
       );
     }
 
     if (screen === "withdraw") {
       return (
         <div className="bg-white min-h-screen max-w-[450px] mx-auto pb-24">
           <div className="p-4 flex items-center gap-3 bg-white shadow">
             <button
               onClick={() => setScreen("home")}
               className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center"
             >
               ←
             </button>
             <h2 className="font-bold">Withdraw</h2>
           </div>
           <div className="p-8 text-center text-gray-400 mt-20 text-lg font-bold">
             💵 Withdraw Coming Soon...
           </div>
           <BottomMenu tab={tab} setTab={setTab} />
         </div>
       );
     }
 
     return (
       <div className="bg-white min-h-screen max-w-[450px] mx-auto pb-24">
         <Profile
           onLogout={onLogout}
           onWallet={() => setScreen("wallet")}
           onWithdraw={() => setScreen("withdraw")}
         />
         <BottomMenu tab={tab} setTab={setTab} />
       </div>
     );
   }
 
   // ================= SHOP TAB =================
   if (tab === "shop") {
     return (
       <div className="bg-white min-h-screen max-w-[450px] mx-auto pb-24">
         <div className="p-4 text-center text-gray-400 mt-20 text-lg font-bold">
           🛒 Shop Coming Soon...
         </div>
         <BottomMenu tab={tab} setTab={setTab} />
       </div>
     );
   }
 
   // ================= MATCHES TAB =================
   if (tab === "matches") {
     return (
       <div className="bg-white min-h-screen max-w-[450px] mx-auto pb-24">
         <div className="p-4 text-center text-gray-400 mt-20 text-lg font-bold">
           📋 My Matches Coming Soon...
         </div>
         <BottomMenu tab={tab} setTab={setTab} />
       </div>
     );
   }
 
   // ================= RESULTS TAB =================
   if (tab === "results") {
     return (
       <div className="bg-white min-h-screen max-w-[450px] mx-auto pb-24">
         <div className="p-4 text-center text-gray-400 mt-20 text-lg font-bold">
           📊 Results Coming Soon...
         </div>
         <BottomMenu tab={tab} setTab={setTab} />
       </div>
     );
   }
 
   // ================= JOIN =================
   if (screen === "join") {
     return (
       <MatchJoin
         match={selectedMatch}
         onBack={() => setScreen("category")}
       />
     );
   }
 
   // ================= CATEGORY =================
   if (screen === "category") {
     return (
       <div className="max-w-[450px] mx-auto">
         <MatchList
           matches={filteredMatches}
           title={selectedCategory}
           onBack={() => setScreen("home")}
           onSelectMatch={(match) => {
             setSelectedMatch(match);
             setScreen("join");
           }}
         />
         <BottomMenu tab={tab} setTab={setTab} />
       </div>
     );
   }
 
   // ================= HOME (PLAY) =================
   return (
     <div className="bg-gray-100 min-h-screen max-w-[450px] mx-auto pb-24">
       <div className="p-4">
 
         {/* ⚙️ Admin Button — উপরে ডানে */}
         <div className="flex justify-end mb-2">
           <button
             onClick={() => setScreen("admin")}
             className="w-10 h-10 bg-white rounded-full shadow flex items-center justify-center text-lg"
           >
             ⚙️
           </button>
         </div>
 
         {/* SLIDER */}
         <div className="relative w-full h-44 overflow-hidden rounded-2xl">
           {categories.slice(0, 3).map((c, i) => (
             <img
               key={i}
               src={c.img}
               className="absolute w-full h-full object-cover transition-opacity duration-1000"
               style={{ opacity: slide === i ? 1 : 0 }}
               alt=""
             />
           ))}
         </div>
 
         <h2 className="text-center font-black text-orange-500 mt-3">
           FREE FIRE
         </h2>
 
         {/* CATEGORY GRID */}
         <div className="grid grid-cols-2 gap-3 mt-4">
           {categories.map((c) => {
             const count = matches.filter(
               (m) => (m.category || "").toLowerCase().trim() === c.key
             ).length;
 
             return (
               <div
                 key={c.key}
                 onClick={() => {
                   setSelectedCategory(c.key);
                   setScreen("category");
                 }}
                 className="bg-white rounded-xl shadow p-2 cursor-pointer active:scale-95 transition"
               >
                 <img
                   src={c.img}
                   className="h-24 w-full object-cover rounded-lg"
                   alt=""
                 />
                 <p className="text-xs font-bold mt-1 uppercase">{c.title}</p>
                 <p className="text-[11px] text-gray-500">{count} Matches</p>
               </div>
             );
           })}
         </div>
 
       </div>
 
       <BottomMenu tab={tab} setTab={setTab} />
     </div>
   );
 };
 
 export default AppDashboard;
 