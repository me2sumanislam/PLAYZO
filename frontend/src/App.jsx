 // src/App.jsx
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
import InstallPage from "./page/InstallPage/InstallPage";
import SplashScreen from "./Component/SplashScreen/SplashScreen";
import AnnouncementModal from "./Component/AnnouncementModal/AnnouncementModal"; // ✅ নতুন

const ONESIGNAL_APP_ID = "ad701a0f-8ef4-4d3c-8967-2a028216da99";
const API_BASE =
  (import.meta.env.VITE_API_URL || "https://playzo-vn8e.onrender.com") + "/api";

async function syncBadge() {
  try {
    if (!("setAppBadge" in navigator)) return;
    const token = localStorage.getItem("token");
    if (!token) return;
    const res = await fetch(`${API_BASE}/notifications?isRead=false&limit=1`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return;
    const data = await res.json();
    const count = typeof data.unreadCount === "number" ? data.unreadCount : 0;
    if (count > 0) {
      await navigator.setAppBadge(count).catch(() => {});
    } else {
      await navigator.clearAppBadge().catch(() => {});
    }
  } catch {}
}

function App() {
  const isStandaloneMode =
    window.matchMedia("(display-mode: standalone)").matches ||
    window.navigator.standalone;

  const [showSplash, setShowSplash] = useState(isStandaloneMode);

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

  // ✅ Splash স্ক্রিনে থাকা অবস্থাতেই redirect করে ফেলি,
  // যাতে Routes রেন্ডার হওয়ার সময় সরাসরি সঠিক পেজ (login) দেখায়,
  // মাঝখানে ওয়েবসাইট (Navbar/Hero) এক ফ্রেমের জন্যও flash না করে।
  const handleSplashFinish = () => {
    if (isStandaloneMode) {
      const path = window.location.pathname;
      if (path === "/" || path === "/login" || path === "") {
        navigate("/app", { replace: true });
      }
    }
    setShowSplash(false);
  };

  // ✅ OneSignal Init (Admin panel এ স্কিপ হবে)
  useEffect(() => {
    // 🚫 Admin panel এ OneSignal দরকার নেই — এটাই auto-refresh এর মূল কারণ ছিল
    if (window.location.pathname.startsWith("/admin")) return;

    const script = document.createElement("script");
    script.src = "https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js";
    script.defer = true;
    document.head.appendChild(script);

    script.onload = () => {
      window.OneSignalDeferred = window.OneSignalDeferred || [];
      window.OneSignalDeferred.push(async (OneSignal) => {
        await OneSignal.init({
          appId: ONESIGNAL_APP_ID,
          notifyButton: { enable: false },
          allowLocalhostAsSecureOrigin: true,
        });

        const permission = await OneSignal.Notifications.permissionNative;
        if (permission === "default") {
          await OneSignal.Notifications.requestPermission();
        }

        const user = (() => {
          try { return JSON.parse(localStorage.getItem("user") || "{}"); }
          catch { return {}; }
        })();
        const userId = user?.id || user?._id;
        if (userId) await OneSignal.login(userId.toString());

        OneSignal.Notifications.addEventListener("foregroundWillDisplay", () => {
          setTimeout(syncBadge, 500);
        });
        OneSignal.Notifications.addEventListener("click", () => {
          setTimeout(syncBadge, 500);
        });

        console.log("✅ OneSignal initialized");
      });
    };

    return () => {
      if (script.parentNode) script.parentNode.removeChild(script);
    };
  }, []);

  // ✅ Admin route এ আগে থেকে registered OneSignal Service Worker থাকলে
  //    সব ইউজারের ব্রাউজারে silently unregister করে দাও (কোনো manual step লাগবে না)
  useEffect(() => {
    if (!window.location.pathname.startsWith("/admin")) return;
    if (!("serviceWorker" in navigator)) return;

    navigator.serviceWorker.getRegistrations().then((regs) => {
      regs.forEach((reg) => {
        const scriptUrl = reg.active?.scriptURL || reg.installing?.scriptURL || "";
        if (scriptUrl.includes("OneSignal")) {
          reg.unregister().catch(() => {});
        }
      });
    }).catch(() => {});
  }, []);

  // ✅ Login হলে OneSignal user set
  useEffect(() => {
    if (!isLoggedIn) return;
    const user = (() => {
      try { return JSON.parse(localStorage.getItem("user") || "{}"); }
      catch { return {}; }
    })();
    const userId = user?.id || user?._id;
    if (!userId) return;
    if (window.OneSignalDeferred) {
      window.OneSignalDeferred.push(async (OneSignal) => {
        await OneSignal.login(userId.toString());
      });
    }
  }, [isLoggedIn]);

  // ✅ Badge sync
  useEffect(() => {
    if (!isLoggedIn) return;
    syncBadge();
    const interval = setInterval(syncBadge, 30_000);
    return () => clearInterval(interval);
  }, [isLoggedIn]);

  // ✅ Page visible হলে badge sync
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === "visible" && isLoggedIn) {
        syncBadge();
      }
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [isLoggedIn]);

  // ✅ Referral redirect
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const refCode = params.get("ref");
    if (refCode && location.pathname === "/") {
      navigate(`/app?ref=${refCode}`, { replace: true });
    }
  }, [location.search, location.pathname, navigate]);

  const handleLoginSuccess = () => {
    setIsLoggedIn(true);
  };

  const handleLogout = () => {
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
    navigate("/app");
  };

  // ✅ Announcement popup — admin panel আর install page ছাড়া সবখানে দেখাবে
 const showAnnouncement =
    !showSplash && isLoggedIn && !location.pathname.startsWith("/admin") && location.pathname !== "/install";

  return (
    <>
      {showSplash && (
        <SplashScreen onFinish={handleSplashFinish} />
      )}

      {!showSplash && (
        <Routes>
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

          <Route path="/install" element={<InstallPage />} />

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
      )}

      {/* ✅ Announcement popup — App.jsx এর top level এ, Routes এর বাইরে,
          তাই route পরিবর্তন হলেও unmount হয় না */}
      {showAnnouncement && <AnnouncementModal />}
    </>
  );
}

export default App;