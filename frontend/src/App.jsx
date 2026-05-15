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

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem("token"));
  const navigate = useNavigate();
  const location = useLocation();

  const isAppMode = location.pathname === "/app" || location.pathname.startsWith("/app");
  const isStandalone = window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone;

  useEffect(() => {
    if (isStandalone && location.pathname === "/") {
      navigate("/app");
    }
  }, []);

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
    navigate("/");
  };

  return (
    <Routes>
      {/* Website Mode */}
      <Route path="/" element={
        <div className="website-layout">
          <Navbar />
          <Hero />
          <HomeCard />
          <Footer />
          
        </div>
      } />

      {/* App Mode */}
      <Route path="/app" element={
        <div className="app-container bg-[#fcfaff] min-h-screen">
          {isLoggedIn ? (
            <AppDashboard onLogout={handleLogout} />
          ) : (
            <Auth onLoginSuccess={handleLoginSuccess} />
          )}
        </div>
      } />

      {/* Admin */}
      <Route path="/admin/*" element={
        <div className="min-h-screen bg-gray-950">
          <AdminPanel onLogout={() => {
            localStorage.removeItem("adminToken");
            localStorage.removeItem("adminInfo");
            navigate("/");
          }} />
        </div>
      } />
    </Routes>
  );
}

export default App;