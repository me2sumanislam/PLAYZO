 import React, { useState, useEffect } from "react";
import "./App.css";

import Footer from "./Component/Footer/Footer";
import Hero from "./Component/HeroSection/HeroSection";
import Navbar from "./Component/Navbar/Navbar";
import HomeCard from "./page/HomeCard/HomeCard";

import AppDashboard from "./Component/AppDashBoard/AppDeshBoard";
import Login from "./Component/Login/Login";

function App() {
  const [isAppMode, setIsAppMode] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      window.navigator.standalone;

    if (isStandalone) {
      setIsAppMode(true);
    }
  }, []);

  // ================= APP MODE =================
  if (isAppMode) {
    return (
      <div className="app-container bg-[#fcfaff] min-h-screen">
        {isLoggedIn ? (
          <AppDashboard onLogout={() => setIsLoggedIn(false)} />
        ) : (
          <Login onLoginSuccess={() => setIsLoggedIn(true)} />
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

      {/* App Preview Button */}
      <button
        onClick={() => setIsAppMode(true)}
        className="fixed bottom-4 right-4 bg-orange-500 text-white px-6 py-3 rounded-full text-xs font-black z-[9999] shadow-2xl active:scale-95 transition-transform uppercase tracking-wider"
      >
        📱 Open Playzo App
      </button>
    </div>
  );
}

export default App;