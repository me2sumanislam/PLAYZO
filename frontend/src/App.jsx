 import React, { useState, useEffect } from "react";
 import "./App.css";
 
 import Footer from "./Component/Footer/Footer";
 import Hero from "./Component/HeroSection/HeroSection";
 import Navbar from "./Component/Navbar/Navbar";
 import HomeCard from "../src/page/HomeCard/HomeCard";
 
 import AppDashboard from "./Component/AppDashBoard/AppDeshBoard";
 import Auth from "./page/Auth/Auth";
 import AdminPanel from "./page/AdminPenal/AdminPanel";
 
 function App() {
   const [isAppMode, setIsAppMode] = useState(false);
   const [isLoggedIn, setIsLoggedIn] = useState(null);
 
   // ================= ADMIN ROUTE =================
   if (window.location.pathname.startsWith("/admin")) {
     return (
       <div className="min-h-screen">
         <AdminPanel
           onLogout={() => {
             localStorage.removeItem("adminToken");
             localStorage.removeItem("adminInfo");
             window.location.href = "/";
           }}
         />
       </div>
     );
   }
 
   // ================= INIT AUTH CHECK =================
   useEffect(() => {
     const userToken = localStorage.getItem("token");
     if (userToken) {
       setIsLoggedIn(true);
     } else {
       setIsLoggedIn(false);
     }
   }, []);
 
   // ================= PWA CHECK =================
   useEffect(() => {
     const isStandalone =
       window.matchMedia("(display-mode: standalone)").matches ||
       window.navigator.standalone;
 
     if (isStandalone) {
       setIsAppMode(true);
     }
   }, []);
 
   // ================= LOGIN SUCCESS =================
   const handleLoginSuccess = () => {
     const userToken = localStorage.getItem("token");
     setIsLoggedIn(!!userToken);
   };
 
   // ================= LOGOUT =================
   const handleLogout = () => {
     localStorage.removeItem("token");
     localStorage.removeItem("user");
     localStorage.removeItem("isAdmin");
     localStorage.removeItem("adminToken");
     localStorage.removeItem("adminInfo");
     localStorage.removeItem("user_balance");
     setIsLoggedIn(false);
   };
 
   // ================= LOADING =================
   if (isLoggedIn === null) {
     return (
       <div className="flex items-center justify-center min-h-screen">
         Loading...
       </div>
     );
   }
 
   // ================= APP MODE (PWA) =================
   if (isAppMode) {
     return (
       <div className="app-container bg-[#fcfaff] min-h-screen">
         {isLoggedIn ? (
           <AppDashboard onLogout={handleLogout} />
         ) : (
           <Auth onLoginSuccess={handleLoginSuccess} />
         )}
       </div>
     );
   }
 
   // ================= WEBSITE MODE =================
   return (
     <div className="website-layout">
       <Navbar />
       <Hero />
       <HomeCard />
       <Footer />
 
       <button
         onClick={() => {
           localStorage.removeItem("token");
           localStorage.removeItem("user");
           localStorage.removeItem("isAdmin");
           localStorage.removeItem("adminToken");
           localStorage.removeItem("adminInfo");
           localStorage.removeItem("user_balance");
 
           setIsLoggedIn(false);
           setIsAppMode(true);
         }}
         className="fixed bottom-4 right-4 bg-orange-500 text-white px-6 py-3 rounded-full text-xs font-black z-[9999] shadow-2xl active:scale-95 transition-transform uppercase tracking-wider"
       >
         📱 Open othiyO App
       </button>
     </div>
   );
 }
 
 export default App;
 