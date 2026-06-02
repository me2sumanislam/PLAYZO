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

const ONESIGNAL_APP_ID = "ad701a0f-8ef4-4d3c-8967-2a028216da99";

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    const token = localStorage.getItem("token");
    const user  = localStorage.getItem("user");
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

  const navigate  = useNavigate();
  const location  = useLocation();

  // ================= OneSignal Init =================
  useEffect(() => {
    const script = document.createElement("script");
    script.src   = "https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js";
    script.defer = true;
    document.head.appendChild(script);

    script.onload = () => {
      window.OneSignalDeferred = window.OneSignalDeferred || [];
      window.OneSignalDeferred.push(async (OneSignal) => {
        await OneSignal.init({
          appId: ONESIGNAL_APP_ID,
          notifyButton:  { enable: false },
          allowLocalhostAsSecureOrigin: true,
        });

        // Permission চাওয়া
        const permission = await OneSignal.Notifications.permissionNative;
        if (permission === "default") {
          await OneSignal.Notifications.requestPermission();
        }

        // User login হলে external ID set করা
        const user   = (() => { try { return JSON.parse(localStorage.getItem("user") || "{}"); } catch { return {}; } })();
        const userId = user?.id || user?._id;
        if (userId) {
          await OneSignal.login(userId.toString());
        }

        console.log("✅ OneSignal initialized");
      });
    };

    return () => {
      if (script.parentNode) script.parentNode.removeChild(script);
    };
  }, []);

  // ================= OneSignal User Login (login হলে) =================
  useEffect(() => {
    if (!isLoggedIn) return;
    const user   = (() => { try { return JSON.parse(localStorage.getItem("user") || "{}"); } catch { return {}; } })();
    const userId = user?.id || user?._id;
    if (!userId) return;

    if (window.OneSignalDeferred) {
      window.OneSignalDeferred.push(async (OneSignal) => {
        await OneSignal.login(userId.toString());
      });
    }
  }, [isLoggedIn]);

  // ================= Referral Link Redirect =================
  useEffect(() => {
    const params  = new URLSearchParams(location.search);
    const refCode = params.get("ref");
    if (refCode && location.pathname === "/") {
      navigate(`/app?ref=${refCode}`, { replace: true });
    }
  }, [location.search, location.pathname, navigate]);

  // ================= PWA Standalone Check =================
  useEffect(() => {
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      window.navigator.standalone;
    if (isStandalone && location.pathname === "/") {
      navigate("/app", { replace: true });
    }
  }, [location.pathname, navigate]);

  // ================= Push Notification (existing) =================
  useEffect(() => {
    if (isLoggedIn) {
      subscribeUserToPush();
    }
  }, [isLoggedIn]);

  // ================= App Badge (Notification Count) =================
  useEffect(() => {
    if (!("setAppBadge" in navigator) || !isLoggedIn) return;

    const updateAppIconBadge = async () => {
      try {
        const API_BASE = import.meta.env.VITE_API_URL || "https://playzo-vn8e.onrender.com";
        const token    = localStorage.getItem("token");
        if (!token) return;

        const res = await fetch(`${API_BASE}/api/notifications?isRead=false&limit=1`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) return;

        const data  = await res.json();
        const count = data.unreadCount || 0;

        if (count > 0) {
          await navigator.setAppBadge(count);
        } else {
          await navigator.clearAppBadge();
        }
      } catch (err) {
        console.error("Badge update failed:", err.message);
      }
    };

    updateAppIconBadge();
    const badgeInterval = setInterval(updateAppIconBadge, 30000);
    return () => clearInterval(badgeInterval);
  }, [isLoggedIn]);

  // ================= Auth Handlers =================
  const handleLoginSuccess = () => {
    setIsLoggedIn(true);
  };

  const handleLogout = () => {
    // OneSignal logout
    if (window.OneSignalDeferred) {
      window.OneSignalDeferred.push(async (OneSignal) => {
        await OneSignal.logout();
      });
    }

    localStorage.clear();
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
            <Referral
              onBack={() => navigate("/app")}
              user={JSON.parse(localStorage.getItem("user") || "{}")}
              token={localStorage.getItem("token")}
            />
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