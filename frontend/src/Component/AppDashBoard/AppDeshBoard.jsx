 import React, { useState, useEffect } from 'react';
import AdminDashboard from '../../page/Admin/AdminDashboard/AdminDashboard';
import BottomMenu from '../BottomMenu/BottomMenu';
import Profile from '../../page/Profile/profile';
import Wallet from '../../page/Wallet/Wallet';

// --- MAIN DASHBOARD ---
const AppDashboard = ({ onLogout }) => {
  const [tab, setTab] = useState('play');

  // ⭐ SCREEN CONTROL (FIXED NAVIGATION)
  const [screen, setScreen] = useState('home');
  const [view, setView] = useState('home');
  const [slide, setSlide] = useState(0);

  const [matches] = useState([]);

  const [defaultBR] = useState([
    { id: 1, title: "BR Classic Match", imageUrl: "/image/img-1.jpg", winPrize: 5000, matchCount: 12 },
    { id: 2, title: "BR Squad Battle", imageUrl: "/image/img-2.jpg", winPrize: 8000, matchCount: 20 },
    { id: 3, title: "BR Fast Fight", imageUrl: "/image/img-3.jpg", winPrize: 3000, matchCount: 8 },
    { id: 4, title: "BR Pro League", imageUrl: "/image/img-1.jpg", winPrize: 10000, matchCount: 25 },
    { id: 5, title: "BR Rookie Cup", imageUrl: "/image/img-2.jpg", winPrize: 2000, matchCount: 5 },
    { id: 6, title: "BR Elite Zone", imageUrl: "/image/img-3.jpg", winPrize: 15000, matchCount: 30 },
  ]);

  useEffect(() => {
    const t = setInterval(() => {
      setSlide((p) => (p === 9 ? 0 : p + 1));
    }, 3000);

    return () => clearInterval(t);
  }, []);

  // ================= WALLET SCREEN =================
  if (screen === "wallet") {
    return (
      <div className="bg-white min-h-screen max-w-[450px] mx-auto pb-24">
        <Wallet onBack={() => setScreen("profile")} />
        <BottomMenu tab={tab} setTab={setTab} />
      </div>
    );
  }

  // ================= PROFILE SCREEN =================
  if (tab === "profile" || screen === "profile") {
    return (
      <div className="bg-white min-h-screen max-w-[450px] mx-auto pb-24">

        <Profile
          onLogout={onLogout}
          onNavigate={(id) => {

            // ⭐ FIXED NAVIGATION FLOW
            if (id === "wallet") {
              setScreen("wallet");
            }

            if (id === "withdraw") {
              alert("Withdraw coming soon");
            }

            if (id === "my_profile") {
              setScreen("profile");
            }
          }}
        />

        <BottomMenu tab={tab} setTab={setTab} />
      </div>
    );
  }

  // ================= ADMIN =================
  if (view === 'admin_dashboard') {
    return <AdminDashboard onBack={() => setView('home')} />;
  }

  // ================= BR LIST =================
  if (view === 'br_list') {
    return (
      <div className="bg-[#fcfaff] min-h-screen max-w-[450px] mx-auto pb-24">

        <div className="p-4 bg-white shadow">
          <button onClick={() => setView('home')}>❮ Back</button>
          <h2 className="font-bold">BR MATCHES</h2>
        </div>

        <div className="p-3 space-y-3">
          {matches.map((m, i) => (
            <div key={i} className="bg-white p-3 rounded-xl shadow">
              {m.title}
            </div>
          ))}
        </div>

        <BottomMenu tab={tab} setTab={setTab} />
      </div>
    );
  }

  // ================= HOME =================
  return (
    <div className="bg-gray-100 min-h-screen max-w-[450px] mx-auto pb-24">

      <div className="p-4">
        <div className="relative w-full h-44 overflow-hidden rounded-2xl">
          {Array.from({ length: 10 }).map((_, i) => (
            <img
              key={i}
              src={`/image/img-${(i % 3) + 1}.jpg`}
              className="absolute w-full h-full object-cover transition-opacity duration-1000"
              style={{ opacity: slide === i ? 1 : 0 }}
              alt=""
            />
          ))}
        </div>

        <h2 className="text-center font-black text-orange-500 mt-3">
          FREE FIRE
        </h2>

        <div className="grid grid-cols-2 gap-3 mt-4">
          {defaultBR.map((m) => (
            <div
              key={m.id}
              onClick={() => setView('br_list')}
              className="bg-white rounded-xl shadow p-2 cursor-pointer"
            >
              <img src={m.imageUrl} className="h-24 w-full object-cover rounded-lg" />
              <p className="text-xs font-bold mt-1">{m.title}</p>
              <p className="text-[10px]">৳{m.winPrize}</p>
            </div>
          ))}
        </div>
      </div>

      <BottomMenu tab={tab} setTab={setTab} />
    </div>
  );
};

export default AppDashboard;