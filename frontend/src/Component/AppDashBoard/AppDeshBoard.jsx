 import React, { useState, useEffect } from 'react';
import Profile from '../../page/Profile/Profile'; 

// --- ১. হেল্পার: কাউন্টডাউন টাইমার ---
const CountdownTimer = ({ startMinutes }) => {
  const [seconds, setSeconds] = useState(parseInt(startMinutes) * 60 || 0);
  useEffect(() => {
    if (seconds <= 0) return;
    const interval = setInterval(() => setSeconds(s => s - 1), 1000);
    return () => clearInterval(interval);
  }, [seconds]);
  if (seconds <= 0) return <span>00m:00s</span>;
  const m = Math.floor((seconds % 3600) / 60), s = seconds % 60;
  return <span>{m < 10 ? "0" + m : m}m:{s < 10 ? "0" + s : s}s</span>;
};

// --- ২. প্রাইজ ডিটেইলস মোডাল ---
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
    <div className="fixed inset-0 z-[100] flex items-center justify-center px-8 bg-black/60" onClick={onClose}>
      <div className="relative w-full max-w-[320px] animate-in zoom-in duration-200 translate-y-16" onClick={e => e.stopPropagation()}>
        <button onClick={onClose} className="absolute -top-3 -right-3 w-8 h-8 bg-white rounded-full flex items-center justify-center font-bold text-gray-800 shadow-xl z-50">✕</button>
        <div className="bg-white rounded-[2rem] overflow-hidden shadow-2xl border border-gray-100">
          <div className="bg-[#FFD740] py-5 text-center">
            <h2 className="font-black text-slate-800 text-lg uppercase tracking-tight">Total Winprize</h2>
            <p className="text-[9px] font-bold text-slate-700 uppercase opacity-80 mt-1">{match.title}</p>
          </div>
          <div className="p-6 space-y-3 pb-8">
            {list.map((item, idx) => (
              <div key={idx} className="flex justify-between items-center text-sm font-bold text-slate-600 border-b border-slate-50 pb-2 last:border-0 last:pb-0">
                <div className="flex items-center gap-2">
                  <span className="text-base">{item.i}</span>
                  <span>{item.l} -</span>
                </div>
                <span className="text-slate-800">{item.v || 0} Taka</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// --- ৩. অ্যাডমিন প্যানেল ---
const AdminPanel = ({ onAddMatch, onBack }) => {
  const [form, setForm] = useState({
    title: '', winPrize: '', entryType: 'Solo', entryFee: '', 
    perKill: '', map: 'Bermuda', version: 'MOBILE', time: '', startsIn: '30',
    prize1: '', prize2: '', prize3: '', prize4: '', prize5: '',
    imageUrl: 'https://i.ibb.co/vY8p6Xz/freefire-thumb.jpg' 
  });

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setForm({ ...form, imageUrl: reader.result });
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onAddMatch({ ...form, id: Date.now(), joined: 0, total: 48 });
    onBack();
  };

  return (
    <div className="p-6 bg-white min-h-screen max-w-[450px] mx-auto overflow-y-auto">
      <div className="flex justify-between items-center mb-6 border-b pb-2">
        <h2 className="text-xl font-black text-indigo-700 uppercase">Create Tournament</h2>
        <button onClick={onBack} className="text-red-500 font-bold">X</button>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4 pb-20">
        <input type="text" placeholder="Match Name" className="w-full p-3 bg-gray-50 border rounded-xl font-bold text-sm" onChange={e => setForm({...form, title: e.target.value})} required />
        <div className="space-y-2">
          <label className="text-[10px] font-black text-gray-400 uppercase ml-1">Thumbnail</label>
          <div className="flex items-center gap-3 bg-gray-50 p-3 border rounded-xl">
            <input type="file" accept="image/*" className="text-[10px] w-full" onChange={handleImageUpload} />
            {form.imageUrl && <img src={form.imageUrl} className="w-10 h-10 object-cover rounded shadow-md border-2 border-white" alt="preview" />}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <input type="number" placeholder="Total Win Prize" className="p-3 bg-gray-50 border rounded-xl font-bold" onChange={e => setForm({...form, winPrize: e.target.value})} required />
          <input type="number" placeholder="Entry Fee" className="p-3 bg-gray-50 border rounded-xl font-bold" onChange={e => setForm({...form, entryFee: e.target.value})} required />
        </div>
        <div className="bg-slate-50 p-4 rounded-2xl space-y-2 border border-slate-200">
          <p className="text-[10px] font-black text-slate-400 uppercase italic">Prizes (1-5) & Per Kill</p>
          <div className="grid grid-cols-3 gap-2">
            {[1, 2, 3, 4, 5].map(n => (
              <input key={n} type="number" placeholder={`${n}${n===1?'st':n===2?'nd':n===3?'rd':'th'}`} className="p-2 border rounded-lg text-xs font-bold" onChange={e => setForm({...form, [`prize${n}`]: e.target.value})} />
            ))}
            <input type="number" placeholder="Kill" className="p-2 border rounded-lg text-xs text-orange-600 font-bold" onChange={e => setForm({...form, perKill: e.target.value})} />
          </div>
        </div>
        <input type="text" placeholder="Date & Time" className="w-full p-3 bg-gray-50 border rounded-xl font-bold text-sm" onChange={e => setForm({...form, time: e.target.value})} required />
        <button type="submit" className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-black shadow-lg">PUBLISH</button>
      </form>
    </div>
  );
};

// --- ৪. মেইন ড্যাশবোর্ড ---
const AppDashboard = ({ onLogout }) => {
  const [tab, setTab] = useState('play'), [view, setView] = useState('home');
  const [slide, setSlide] = useState(0), [selMatch, setSelMatch] = useState(null);
  
  const [matches, setMatches] = useState(() => {
    const saved = localStorage.getItem('local_matches');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('local_matches', JSON.stringify(matches));
  }, [matches]);

  const imgs = ["/image/img-1.jpg", "/image/img-2.jpg", "/image/img-3.jpg"];
  useEffect(() => {
    const t = setInterval(() => setSlide(p => (p === imgs.length - 1 ? 0 : p + 1)), 4000);
    return () => clearInterval(t);
  }, []);

  if (view === 'br_list') return (
    <div className="bg-[#fcfaff] min-h-screen max-w-[450px] mx-auto pb-24 font-sans">
      <PrizeModal isOpen={!!selMatch} onClose={() => setSelMatch(null)} match={selMatch || {}} />
      <div className="p-4 bg-white shadow-sm flex items-center justify-between border-b sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <button onClick={() => setView('home')} className="text-xl font-bold">❮</button>
          <h2 className="font-black uppercase text-sm tracking-tight">BR MATCHES</h2>
        </div>
        <button className="text-blue-500 text-xl" onClick={() => window.location.reload()}>🔄</button>
      </div>

      <div className="p-3 space-y-6">
        {matches.map(m => (
          <div key={m.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden relative">
            <div className="p-4">
              <div className="flex gap-4 mb-4">
                <img src={m.imageUrl} alt="match" className="w-20 h-14 object-cover rounded-lg shadow-md" />
                <div className="flex-1">
                  <h3 className="font-black text-[13px] text-slate-800 leading-tight uppercase">{m.title} | {m.version}</h3>
                  <p className="text-[10px] text-red-500 font-bold mt-1 tracking-tighter">{m.time}</p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-y-4 text-center mb-4 font-black text-slate-800">
                <div><p className="text-[9px] text-gray-400 uppercase">Win Prize</p><p className="text-sm">{m.winPrize} TK</p></div>
                <div><p className="text-[9px] text-gray-400 uppercase">Entry Type</p><p className="text-sm">{m.entryType}</p></div>
                <div><p className="text-[9px] text-gray-400 uppercase">Entry Fee</p><p className="text-sm">{m.entryFee} TK</p></div>
                <div><p className="text-[9px] text-gray-400 uppercase">Per Kill</p><p className="text-sm">{m.perKill} TK</p></div>
                <div><p className="text-[9px] text-gray-400 uppercase">Map</p><p className="text-sm">{m.map}</p></div>
                <div><p className="text-[9px] text-gray-400 uppercase">Version</p><p className="text-sm">{m.version}</p></div>
              </div>

              {/* প্রগ্রেস বার এবং জয়েন বাটন সেকশন */}
              <div className="mb-4">
                <div className="w-full bg-gray-100 h-3 rounded-full overflow-hidden border">
                  <div className="bg-green-500 h-full transition-all duration-1000" style={{width: `${(m.joined/m.total)*100}%`}}></div>
                </div>
                <div className="flex justify-between items-center mt-1.5">
                  <span className="text-[9px] font-bold text-gray-500 italic">Only {m.total - m.joined} spots left</span>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black text-slate-700">{m.joined}/{m.total}</span>
                    <button className="bg-indigo-600 text-white px-4 py-1 rounded-md text-[10px] font-black uppercase shadow-md active:scale-90 transition-transform">Join</button>
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <button className="flex-1 py-2 border border-indigo-600 text-indigo-600 rounded-lg text-[10px] font-black uppercase">🔑 Room Details ∨</button>
                <button onClick={() => setSelMatch(m)} className="flex-1 py-2 border border-indigo-600 text-indigo-600 rounded-lg text-[10px] font-black uppercase">🏆 Prize Details ∨</button>
              </div>
            </div>
            <div className="bg-green-700 text-white py-3 text-center text-xs font-black uppercase tracking-wider">
               STARTS IN - <CountdownTimer startMinutes={m.startsIn} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  if (view === 'admin') return <AdminPanel onAddMatch={m => setMatches([m, ...matches])} onBack={() => setView('home')} />;

  return (
    <div className="bg-[#f3f4f6] min-h-screen max-w-[450px] mx-auto relative pb-24 shadow-2xl overflow-y-auto">
      <div className="absolute top-4 right-4 z-[60]">
        <button onClick={() => setView('admin')} className="w-10 h-10 bg-white/90 backdrop-blur-md rounded-full flex items-center justify-center shadow-lg border border-white text-xl">⚙️</button>
      </div>
      {tab === 'profile' ? <Profile onLogout={onLogout} onNavigate={(p) => console.log(p)} /> : (
        <>
          <div className="relative h-48 overflow-hidden rounded-b-[2.5rem] bg-slate-900 shadow-xl">
            {imgs.map((img, i) => <img key={i} src={img} className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${i === slide ? 'opacity-80' : 'opacity-0'}`} alt="" />)}
          </div>
          {tab === 'play' && (
            <div className="mt-6 px-4">
              <div className="bg-white p-5 rounded-[2.5rem] shadow-sm border flex items-center justify-between cursor-pointer active:scale-95 transition-all" onClick={() => setView('br_list')}>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-slate-800 rounded-2xl flex items-center justify-center text-white text-[8px] font-black italic shadow-md border-2 border-slate-700">BR</div>
                  <div><h4 className="font-black text-sm text-slate-800 uppercase tracking-tighter">Battle Royale</h4><p className="text-[9px] text-green-500 font-bold uppercase">{matches.length} matches online</p></div>
                </div>
                <span className="text-gray-300 text-2xl">❯</span>
              </div>
            </div>
          )}
        </>
      )}
      <div className="fixed bottom-0 w-full max-w-[450px] bg-white border-t flex justify-around py-3 px-2 z-50 rounded-t-[2rem] shadow-2xl">
        {[ {id:'shop', i:'🏪', l:'Shop'}, {id:'play', i:'🎮', l:'Play'}, {id:'my_match', i:'🏆', l:'Match'}, {id:'results', i:'📊', l:'Results'}, {id:'profile', i:'👤', l:'Profile'} ].map(n => (
          <div key={n.id} onClick={() => setTab(n.id)} className={`flex flex-col items-center gap-1 cursor-pointer transition-all ${tab === n.id ? 'text-indigo-700' : 'text-gray-300'}`}>
            <span className="text-xl">{n.i}</span><span className="text-[8px] font-black uppercase tracking-tighter">{n.l}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AppDashboard;