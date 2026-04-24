 import React, { useState, useEffect } from "react";
import "./App.css";

// WEBSITE (NO CHANGE)
import Footer from "./Component/Footer/Footer";
import Hero from "./Component/HeroSection/HeroSection";
import Navbar from "./Component/Navbar/Navbar";
import HomeCard from "./page/HomeCard/HomeCard";

// APP SECTION
import AppDashboard from "./Component/AppDashBoard/AppDeshBoard";
import Login from "./Component/Login/Login";

function App() {
  const [isAppMode, setIsAppMode] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const isStandalone = window.matchMedia(
      "(display-mode: standalone)"
    ).matches;

    if (isStandalone) {
      setIsAppMode(true);
    }
  }, []);

  // ================= APP MODE =================
  if (isAppMode) {
    return (
      <div className="app-container">
        {isLoggedIn ? (
          <AppDashboard
            onLogout={() => setIsLoggedIn(false)}
          />
        ) : (
          <Login
            onLoginSuccess={() => setIsLoggedIn(true)}
          />
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

      {/* TEST BUTTON (NO UI CHANGE IMPACT) */}
      <button
        onClick={() => setIsAppMode(true)}
        className="fixed bottom-4 right-4 bg-orange-500 text-white px-4 py-2 rounded-full text-[10px] font-bold z-[9999] shadow-lg active:scale-95"
      >
        Preview App Interface
      </button>
    </div>
  );
}

export default App;