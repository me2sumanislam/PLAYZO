 import React, { useState, useEffect } from "react";
import { Routes, Route, useNavigate, useLocation } from "react-router-dom";
import "./App.css";

import Footer from "./Component/Footer/Footer";
import Hero from "./Component/HeroSection/HeroSection";
import Navbar from "./Component/Navbar/Navbar";
import HomeCard from "./page/HomeCard/HomeCard";
import AppDashboard from "./Component/AppDashBoard/AppDeshBoard";
import Auth from "./page/Auth/Auth";
import AdminPanel from "./page/AdminPenal/AdminPanel";
import Referral from "./page/Referral/Referral";

import { subscribeUserToPush } from "./utils/pushNotification";

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    const token = localStorage.getItem("token");
    const user = localStorage.getItem("user");
    if (!token || !user) return false;
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      if (payload.exp * 1000 < Date.now()) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        return false;
      }
      return true;
    } catch {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      return false;
    }
  });

  const navigate = useNavigate();
  const location = useLocation();

  const isStandalone =
    window.matchMedia("(display-mode: standalone)").matches ||
    window.navigator.standalone;

  useEffect(() => {
    if (isStandalone && location.pathname === "/") {
      navigate("/app");
    }
  }, [isStandalone, location.pathname, navigate]);

  useEffect(() => {
    if (isLoggedIn) {
      subscribeUserToPush();
    }
  }, [isLoggedIn]);

  // PWA Badge Logic
  useEffect(() => {
    const updateAppIconBadge = async () => {
      if (!("setAppBadge" in navigator) || !isLoggedIn) return;
      
      try {
        const API_BASE = import.meta.env.VITE_API_URL || "https://playzo-vn8e.onrender.com/api";
        const res = await fetch(`${API_BASE}/notifications?isRead=false&limit=1`);
        const data = await res.json();
        
        const count = data.unreadCount || 0;
        if (count > 0) {
          await navigator.setAppBadge(count);
        } else {
          await navigator.clearAppBadge();
        }
      } catch (err) {
        console.error("Badge update failed:", err);
      }
    };

    updateAppIconBadge();

    const badgeInterval = setInterval(updateAppIconBadge, 30000);

    return () => {
      clearInterval(badgeInterval);
    };
  }, [isLoggedIn]);

  const handleLoginSuccess = () => {
    setIsLoggedIn(!!localStorage.getItem("token"));
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("isAdmin");
    localStorage.removeItem("adminToken");
    localStorage.removeItem("adminInfo");
    localStorage.removeItem("user_balance");
    setIsLoggedIn(false);
    
    if ("clearAppBadge" in navigator) {
      navigator.clearAppBadge().catch(() => {});
    }

    navigate("/");
  };

  return (
    <Routes>
      {/* Website Mode */}
      <Route
        path="/"
        element={
          <div className="website-layout">
            <Navbar />
            <Hero />
            <HomeCard />
            <Footer />
          </div>
        }
      />

      {/* App Mode */}
      <Route
        path="/app"
        element={
          <div className="app-container bg-[#fcfaff] min-h-screen">
            {isLoggedIn ? (
              <AppDashboard onLogout={handleLogout} />
            ) : (
              <Auth onLoginSuccess={handleLoginSuccess} />
            )}
          </div>
        }
      />

      {/* Referral Page */}
      <Route
        path="/referral"
        element={
          isLoggedIn ? (
            <Referral onBack={() => navigate("/app")} />
          ) : (
            <Auth onLoginSuccess={handleLoginSuccess} />
          )
        }
      />

      {/* Admin Panel */}
      <Route
        path="/admin/*"
        element={
          <div className="min-h-screen bg-gray-950">
            <AdminPanel
              onLogout={() => {
                localStorage.removeItem("adminToken");
                localStorage.removeItem("adminInfo");
                navigate("/");
              }}
            />
          </div>
        }
      />
    </Routes>
  );
}

export default App;