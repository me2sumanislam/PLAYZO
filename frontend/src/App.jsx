 import React, { useState, useEffect } from "react";
import "./App.css";

// ওয়েবসাইট সেকশন (Landing Page)
import Footer from "./Component/Footer/Footer";
import Hero from "./Component/HeroSection/HeroSection";
import Navbar from "./Component/Navbar/Navbar";
import HomeCard from "./page/HomeCard/HomeCard";

// অ্যাপ সেকশন (App UI & Logic)
import AppDashboard from "./Component/AppDashBoard/AppDeshBoard";
import Login from "./Component/Login/Login";

function App() {
  // ইউজার অ্যাপ মোডে আছে কিনা তা চেক করার স্টেট
  const [isAppMode, setIsAppMode] = useState(false);
  // ইউজার লগইন করা আছে কিনা তার স্টেট
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    // চেক করা হচ্ছে ইউজার কি ইন্সটল করা অ্যাপ (Standalone) থেকে ওপেন করেছে কি না
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    
    if (isStandalone) {
      setIsAppMode(true);
    }
  }, []);

  /**
   * লজিক ১: অ্যাপ মোড (যখন ইউজার মোবাইল অ্যাপ বা আইকন থেকে ঢুকবে)
   */
  if (isAppMode) {
    return (
      <div className="app-container">
        {isLoggedIn ? (
          // লগইন করা থাকলে সরাসরি ড্যাশবোর্ড (ইমেজের মতো ভিউ)
          <AppDashboard onLogout={() => setIsLoggedIn(false)} />
        ) : (
          // লগইন না থাকলে প্রথমে লগইন পেজ
          <Login onLoginSuccess={() => setIsLoggedIn(true)} />
        )}
      </div>
    );
  }

  /**
   * লজিক ২: ওয়েবসাইট মোড (ব্রাউজারে uthiyo.com এ সাধারণ ভিজিট)
   */
  return (
    <div className="website-layout">
      <Navbar />
      <Hero />
      <HomeCard />
      <Footer />
      
      {/* ডেভেলপমেন্ট এবং টেস্ট করার জন্য নিচের বাটনটি খুব কাজের */}
      <button 
        onClick={() => setIsAppMode(true)}
        className="fixed bottom-4 right-4 bg-orange-500 text-white px-4 py-2 rounded-full text-[10px] font-bold z-[9999] shadow-lg transition-all active:scale-95"
      >
        Preview App Interface
      </button>
    </div>
  );
}

export default App;