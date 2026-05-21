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

  // -------------------------------------------------------------------------
  // 🔴 PWA মোবাইলের হোম স্ক্রিন আইকনে নোটিফিকেশন ব্যাজ (Badge API) দেখানোর লজিক
  // -------------------------------------------------------------------------
  useEffect(() => {
    const updateAppIconBadge = async () => {
      // ব্রাউজার বা মোবাইল এই Badging API সাপোর্ট করে কিনা এবং ইউজার লগইন আছে কিনা চেক
      if ("setAppBadge" in navigator && isLoggedIn) {
        try {
          const res = await fetch("/api/notifications/list");
          const data = await res.json();
          
          if (data.success && data.unreadCount > 0) {
            // মোবাইলের স্ক্রিনে থাকা অ্যাপের আইকনে ৩ বা ৪টি নোটিফিকেশনের সংখ্যা দেখাবে
            await navigator.setAppBadge(data.unreadCount);
          } else {
            // কোনো নোটিফিকেশন না থাকলে বা রিড হয়ে গেলে ব্যাজ ক্লিয়ার করবে
            await navigator.clearAppBadge();
          }
        } catch (err) {
          console.error("Failed to update mobile app icon badge:", err);
        }
      }
    };

    // অ্যাপ ওপেন হওয়ার সাথে সাথে একবার রান হবে
    updateAppIconBadge();

    // প্রতি ১ মিনিট (৬০,০০০ মিলি-সেকেন্ড) পর পর ব্যাকগ্রাউন্ডে নোটিফিকেশন সংখ্যা আপডেট করবে
    const badgeInterval = setInterval(updateAppIconBadge, 60000);

    // ইউজার লগআউট করলে বা অ্যাপের এই অংশ মেমোরি থেকে রিলিজ হলে ব্যাজ ও ইন্টারভাল ক্লিয়ার করবে
    return () => {
      clearInterval(badgeInterval);
      if ("clearAppBadge" in navigator) {
        navigator.clearAppBadge().catch((e) => console.error(e));
      }
    };
  }, [isLoggedIn]); // ইউজার লগইন বা লগআউট স্টেটের উপর নজর রাখবে

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
    
    // লগআউট করার সাথে সাথে মোবাইলের হোম স্ক্রিনের লাল ব্যাজ মুছে ফেলা
    if ("clearAppBadge" in navigator) {
      navigator.clearAppBadge().catch((e) => console.error(e));
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
          <isLoggedIn ? (
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