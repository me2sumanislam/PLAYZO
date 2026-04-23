 import React, { useState, useEffect } from 'react';
import Profile from '../../page/Profile/Profile';
import AdminDashboard from '../../page/Admin/AdminDashboard/AdminDashboard';

// --- Countdown Timer ---
const CountdownTimer = ({ startMinutes }) => {
  const [seconds, setSeconds] = useState(parseInt(startMinutes) * 60 || 0);

  useEffect(() => {
    if (seconds <= 0) return;
    const interval = setInterval(() => setSeconds((s) => s - 1), 1000);
    return () => clearInterval(interval);
  }, [seconds]);

  if (seconds <= 0) return <span>00m:00s</span>;

  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;

  return (
    <span>
      {m < 10 ? "0" + m : m}m:{s < 10 ? "0" + s : s}s
    </span>
  );
};

// --- Prize Modal ---
const PrizeModal = ({ isOpen, onClose, match }) => {
  if (!isOpen) return null;

  const list = [
    { i: '👑', l: 'Winner', v: match.prize1 },
    { i: '🥈', l: '2nd Position', v: match.prize2 },
    { i: '🥉', l: '3rd Position', v: match.prize3 },
    { i: '🏅', l: '4th Position', v: match.prize4 },
    { i: '🏅', l: '5th Position', v: match.prize5 },
    { i: '🔥', l: 'Per Kill', v: match.perKill },
    { i: '🏆', l: 'Total Prize Pool', v: match.winPrize },
  ];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center px-4 bg-black/60" onClick={onClose}>
      <div className="relative w-full max-w-[320px]" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className="absolute -top-3 -right-3 w-8 h-8 bg-white rounded-full font-bold shadow z-50">
          ✕
        </button>

        <div className="bg-white rounded-3xl overflow-hidden shadow-xl">
          <div className="bg-yellow-300 py-5 text-center">
            <h2 className="font-black text-slate-800 text-lg">Total Win Prize</h2>
            <p className="text-[10px] font-bold">{match.title}</p>
          </div>

          <div className="p-5 space-y-3">
            {list.map((item, idx) => (
              <div key={idx} className="flex justify-between text-sm font-bold border-b pb-2">
                <span>{item.i} {item.l}</span>
                <span>{item.v || 0} TK</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// --- Main Dashboard ---
const AppDashboard = ({ onLogout }) => {
  const [tab, setTab] = useState('play');
  const [view, setView] = useState('home');
  const [slide, setSlide] = useState(0);
  const [selMatch, setSelMatch] = useState(null);

  const [matches, setMatches] = useState(() => {
    const saved = localStorage.getItem('local_matches');
    return saved ? JSON.parse(saved) : [];
  });

  const [defaultBR] = useState([
    { id: 1, title: "BR Classic Match", time: "Today 7:00 PM", imageUrl: "/image/img-1.jpg", winPrize: 5000, matchCount: 12 },
    { id: 2, title: "BR Squad Battle", time: "Today 8:00 PM", imageUrl: "/image/img-2.jpg", winPrize: 8000, matchCount: 20 },
    { id: 3, title: "BR Fast Fight", time: "Tomorrow 5:00 PM", imageUrl: "/image/img-3.jpg", winPrize: 3000, matchCount: 8 },
    { id: 4, title: "BR Pro League", time: "Tomorrow 6:00 PM", imageUrl: "/image/img-1.jpg", winPrize: 10000, matchCount: 25 },
    { id: 5, title: "BR Rookie Cup", time: "Today 9:00 PM", imageUrl: "/image/img-2.jpg", winPrize: 2000, matchCount: 5 },
    { id: 6, title: "BR Elite Zone", time: "Tonight 10:00 PM", imageUrl: "/image/img-3.jpg", winPrize: 15000, matchCount: 30 },
  ]);

  useEffect(() => {
    localStorage.setItem('local_matches', JSON.stringify(matches));
  }, [matches]);

  const imgs = ["/image/img-1.jpg", "/image/img-2.jpg", "/image/img-3.jpg"];

  useEffect(() => {
    const t = setInterval(() => {
      setSlide((p) => (p === 9 ? 0 : p + 1)); // 10 SLIDES
    }, 3000);

    return () => clearInterval(t);
  }, []);

  if (view === 'admin_dashboard') {
    return <AdminDashboard onBack={() => setView('home')} />;
  }

  if (view === 'br_list') {
    return (
      <div className="bg-[#fcfaff] min-h-screen max-w-[450px] mx-auto pb-24">
        <PrizeModal
          isOpen={!!selMatch}
          onClose={() => setSelMatch(null)}
          match={selMatch || {}}
        />

        <div className="p-4 bg-white flex justify-between items-center sticky top-0 z-50 shadow-sm">
          <div className="flex items-center gap-4">
            <button onClick={() => setView('home')}>❮</button>
            <h2 className="font-black text-sm">BR MATCHES</h2>
          </div>
        </div>

        <div className="p-3 space-y-5">
          {matches.map((m) => (
            <div key={m.id} className="bg-white rounded-2xl border shadow-sm overflow-hidden">
              <div className="p-4">
                <h3 className="font-black text-xs">{m.title}</h3>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-100 min-h-screen max-w-[450px] mx-auto pb-24 relative">

      <div className="p-4 mt-4">

        {/* ⭐ SLIDER (10 IMAGES) */}
        <div className="rounded-3xl overflow-hidden shadow">
          <div className="relative w-full h-44">
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
        </div>

        {/* ⭐ MARQUEE */}
        <div className="mt-3 bg-white py-2 rounded-xl shadow overflow-hidden">
          <marquee className="text-xs font-bold text-red-500">
            🔥 Welcome to Battle Arena • Play Free Fire • Win Rewards • Join Now 🔥
          </marquee>
        </div>

        {/* ⭐ FREE FIRE TEXT */}
        <div className="mt-3 text-center">
          <h2 className="text-lg font-black text-orange-500 tracking-widest">
            FREE FIRE
          </h2>
        </div>
        {/* 2 COLUMN CARDS (UNCHANGED) */}
        <div className="mt-4 grid grid-cols-2 gap-3 px-2">
          {defaultBR.map((m) => (
            <div
              key={m.id}
              onClick={() => setView('br_list')}
              className="bg-white rounded-2xl shadow-md overflow-hidden cursor-pointer"
            >
              <img src={m.imageUrl} className="w-full h-24 object-cover" alt="" />

              <div className="p-2">
                <h4 className="font-bold text-xs">{m.title}</h4>

                <div className="flex justify-between text-[10px] mt-2 font-bold">
                  <span>Match: {m.matchCount}</span>
                  <span>৳{m.winPrize}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
};

export default AppDashboard;