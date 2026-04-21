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

  useEffect(() => {
    localStorage.setItem('local_matches', JSON.stringify(matches));
  }, [matches]);

  const imgs = ["/image/img-1.jpg", "/image/img-2.jpg", "/image/img-3.jpg"];

  useEffect(() => {
    const t = setInterval(() => {
      setSlide((p) => (p === imgs.length - 1 ? 0 : p + 1));
    }, 4000);

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
          <button onClick={() => window.location.reload()}>🔄</button>
        </div>

        <div className="p-3 space-y-5">
          {matches.map((m) => (
            <div key={m.id} className="bg-white rounded-2xl border shadow-sm overflow-hidden">
              <div className="p-4">
                <div className="flex gap-3">
                  <img src={m.imageUrl} alt="" className="w-20 h-14 rounded-lg object-cover" />
                  <div className="flex-1">
                    <h3 className="font-black text-xs">{m.title}</h3>
                    <p className="text-[10px] text-red-500">{m.time}</p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3 text-center mt-4 text-xs font-bold">
                  <div><p>Prize</p><p>{m.winPrize}</p></div>
                  <div><p>Type</p><p>{m.entryType}</p></div>
                  <div><p>Fee</p><p>{m.entryFee}</p></div>
                </div>

                <div className="mt-4">
                  <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="bg-green-500 h-full" style={{ width: `${(m.joined / m.total) * 100}%` }}></div>
                  </div>
                </div>

                <div className="flex gap-2 mt-4">
                  <button className="flex-1 py-2 border rounded-lg text-xs">Room</button>
                  <button onClick={() => setSelMatch(m)} className="flex-1 py-2 border rounded-lg text-xs">
                    Prize
                  </button>
                </div>
              </div>

              <div className="bg-green-700 text-white text-center py-2 text-xs">
                STARTS IN - <CountdownTimer startMinutes={m.startsIn} />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-100 min-h-screen max-w-[450px] mx-auto pb-24 relative">
      <div className="absolute top-4 right-4 z-50">
        <button
          onClick={() => setView('admin_dashboard')}
          className="w-10 h-10 bg-white rounded-full shadow flex items-center justify-center"
        >
          ⚙️
        </button>
      </div>

      {tab === 'profile' ? (
        <Profile onLogout={onLogout} onNavigate={(p) => console.log(p)} />
      ) : (
        <>
          <div className="relative h-48 overflow-hidden rounded-b-3xl">
            {imgs.map((img, i) => (
              <img
                key={i}
                src={img}
                alt=""
                className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${i === slide ? 'opacity-100' : 'opacity-0'
                  }`}
              />
            ))}
          </div>

          <div className="p-4 mt-4">
            <div
              onClick={() => setView('br_list')}
              className="bg-white p-5 rounded-3xl shadow flex justify-between items-center"
            >
              <div>
                <h4 className="font-black">Battle Royale</h4>
                <p className="text-xs text-green-500">{matches.length} matches online</p>
              </div>
              <span>❯</span>
            </div>
          </div>
        </>
      )}

      <div className="fixed bottom-0 w-full max-w-[450px] bg-white border-t flex justify-around py-3 rounded-t-3xl">
        {[
          { id: 'shop', i: '🏪', l: 'Shop' },
          { id: 'play', i: '🎮', l: 'Play' },
          { id: 'my_match', i: '🏆', l: 'Match' },
          { id: 'results', i: '📊', l: 'Results' },
          { id: 'profile', i: '👤', l: 'Profile' },
        ].map((n) => (
          <div
            key={n.id}
            onClick={() => setTab(n.id)}
            className={`text-center text-xs ${tab === n.id ? 'text-indigo-600' : 'text-gray-400'}`}
          >
            <div>{n.i}</div>
            <div>{n.l}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AppDashboard;