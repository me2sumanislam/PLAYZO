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
  const [isAdmin, setIsAdmin] = useState(false);

  // ================= INIT AUTH CHECK =================
  useEffect(() => {
    const token = localStorage.getItem("token");
    const admin = localStorage.getItem("isAdmin");

    if (token) {
      setIsLoggedIn(true);
      setIsAdmin(admin === "true");
    } else {
      setIsLoggedIn(false);
      setIsAdmin(false);
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
    const token = localStorage.getItem("token");
    const admin = localStorage.getItem("isAdmin");

    setIsLoggedIn(!!token);
    setIsAdmin(admin === "true");
  };

  // ================= LOGOUT =================
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("isAdmin");

    setIsLoggedIn(false);
    setIsAdmin(false);
  };

  // ================= LOADING =================
  if (isLoggedIn === null) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        Loading...
      </div>
    );
  }

  // ================= APP MODE =================
  if (isAppMode) {
    return (
      <div className="app-container bg-[#fcfaff] min-h-screen">
        {isLoggedIn ? (
          isAdmin ? (
            <AdminPanel onLogout={handleLogout} />
          ) : (
            <AppDashboard onLogout={handleLogout} />
          )
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

          setIsLoggedIn(false);
          setIsAdmin(false);
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