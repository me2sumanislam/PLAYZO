 import React, { useState, useEffect } from 'react';
import Profile from '../../page/Profile/Profile'; // উপরের ফাইলটি ইমপোর্ট করা হয়েছে

// কাউন্টডাউন টাইমার
const CountdownTimer = ({ startMinutes }) => {
  const [seconds, setSeconds] = useState(parseInt(startMinutes) * 60 || 0);
  useEffect(() => {
    if (seconds <= 0) return;
    const interval = setInterval(() => setSeconds(s => s - 1), 1000);
    return () => clearInterval(interval);
  }, [seconds]);
  if (seconds <= 0) return <span>Started</span>;
  const m = Math.floor((seconds % 3600) / 60), s = seconds % 60;
  return <span>{m < 10 ? "0" + m : m}m:{s < 10 ? "0" + s : s}s</span>;
};

// প্রাইজ মোডাল
const PrizeModal = ({ isOpen, onClose, match }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center px-6 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white w-full max-w-[320px] rounded-3xl overflow-hidden shadow-2xl relative" onClick={e => e.stopPropagation()}>
        <div className="bg-yellow-400 py-4 text-center font-black">TOTAL WINPRIZE</div>
        <div className="p-6 space-y-2">
          {[{l:"Winner",v:match.prize1}, {l:"2nd",v:match.prize2}, {l:"3rd",v:match.prize3}].map((r,i) => (
            <div key={i} className="flex justify-between border-b border-dashed pb-1 text-sm font-bold">
              <span>{r.l}</span><span>{r.v || 0} TK</span>
            </div>
          ))}
          <div className="flex justify-between pt-2 text-orange-600 font-black"><span>🔥 Per Kill</span><span>{match.perKill} TK</span></div>
        </div>
        <button onClick={onClose} className="w-full bg-gray-100 py-3 font-bold text-gray-500">Close</button>
      </div>
    </div>
  );
};

const AppDashboard = ({ onLogout }) => {
  const [tab, setTab] = useState('play'), [view, setView] = useState('home'), [matches, setMatches] = useState([]);
  const [slide, setSlide] = useState(0), [selMatch, setSelMatch] = useState(null);
  const imgs = ["/image/img-1.jpg", "/image/img-2.jpg", "/image/img-3.jpg"];

  useEffect(() => {
    const t = setInterval(() => setSlide(p => (p === imgs.length - 1 ? 0 : p + 1)), 4000);
    return () => clearInterval(t);
  }, []);

  // ডাইনামিক ভিউ হ্যান্ডলিং
  if (view === 'br_list') return (
    <div className="bg-[#fcfaff] min-h-screen max-w-[450px] mx-auto pb-20">
      <PrizeModal isOpen={!!selMatch} onClose={() => setSelMatch(null)} match={selMatch || {}} />
      <div className="p-4 bg-white shadow-sm flex items-center gap-4">
        <button onClick={() => setView('home')} className="text-xl">❮</button>
        <h2 className="font-black uppercase">BR MATCHES</h2>
      </div>
      <div className="p-3 space-y-4">
        {matches.map(m => (
          <div key={m.id} className="bg-white rounded-2xl shadow-md border overflow-hidden">
            <div className="p-3 flex gap-3">
              <div className="w-24 h-14 bg-indigo-900 rounded-lg flex items-center justify-center text-white text-[10px] font-black italic">FREE FIRE</div>
              <div><h3 className="font-black text-sm">{m.title}</h3><p className="text-[10px] text-red-500 font-bold">{m.time}</p></div>
            </div>
            <div className="px-4 py-2 grid grid-cols-3 text-center text-[10px] border-t">
               <div><p className="text-gray-400">Entry</p><p className="font-black">{m.entryFee} TK</p></div>
               <div><p className="text-gray-400">Prize</p><p className="font-black">{m.winPrize} TK</p></div>
               <div><p className="text-gray-400">Map</p><p className="font-black">{m.map}</p></div>
            </div>
            <div className="bg-gray-50 p-2 flex justify-center gap-2">
               <button onClick={() => setSelMatch(m)} className="bg-white text-[10px] px-4 py-1.5 rounded-lg border font-bold">🏆 Prize Details</button>
            </div>
            <div className="bg-green-600 text-white text-center py-1.5 text-[10px] font-bold">STARTS IN: <CountdownTimer startMinutes={m.startsIn} /></div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="bg-[#f3f4f6] min-h-screen max-w-[450px] mx-auto relative pb-24 shadow-2xl overflow-y-auto">
      {tab === 'profile' ? (
        <Profile onLogout={onLogout} onNavigate={(path) => console.log(path)} />
      ) : (
        <>
          {/* স্লাইডার সেকশন */}
          <div className="relative h-44 overflow-hidden rounded-b-[2.5rem] bg-slate-900">
            {imgs.map((img, i) => <img key={i} src={img} className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${i === slide ? 'opacity-75' : 'opacity-0'}`} alt="" />)}
          </div>

          {tab === 'play' && (
            <div className="mt-4">
               {/* মারকুই নোটিশ */}
               <div className="bg-orange-100 py-2 overflow-hidden border-y border-orange-200">
                <div className="flex animate-marquee whitespace-nowrap text-[10px] font-bold text-orange-600 uppercase">
                  <span>📢 স্বাগতম uthiYO-তে! টুর্নামেন্ট খেলে জিতে নিন আকর্ষণীয় পুরষ্কার। &nbsp;&nbsp;</span>
                  <span>📢 স্বাগতম uthiYO-তে! টুর্নামেন্ট খেলে জিতে নিন আকর্ষণীয় পুরষ্কার। &nbsp;&nbsp;</span>
                </div>
                <style>{`@keyframes marquee { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } } .animate-marquee { display: flex; width: max-content; animation: marquee 20s linear infinite; }`}</style>
              </div>

              <div className="p-4 grid grid-cols-2 gap-4 mt-4">
                <div onClick={() => setView('br_list')} className="bg-white p-4 rounded-3xl border text-center cursor-pointer active:scale-95 transition-all">
                  <div className="h-20 bg-slate-800 rounded-2xl mb-2 flex items-center justify-center text-white font-black italic">BR MATCH</div>
                  <p className="text-[10px] font-black uppercase">BR Tournament</p>
                  <p className="text-[9px] text-green-500 font-bold">{matches.length} matches</p>
                </div>
                <div className="bg-white p-4 rounded-3xl border text-center opacity-50 cursor-not-allowed">
                  <div className="h-20 bg-slate-200 rounded-2xl mb-2 flex items-center justify-center text-gray-400 font-black italic">CS MATCH</div>
                  <p className="text-[10px] font-black uppercase text-gray-400">Coming Soon</p>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* নেভিগেশন বার */}
      <div className="fixed bottom-0 w-full max-w-[450px] bg-white border-t flex justify-around py-3 rounded-t-3xl shadow-2xl z-50">
        {[ {id:'shop', i:'🏪'}, {id:'my_match', i:'🏆'}, {id:'play', i:'🎮'}, {id:'results', i:'📊'}, {id:'profile', i:'👤'} ].map(n => (
          <div key={n.id} onClick={() => setTab(n.id)} className={`flex flex-col items-center gap-1 cursor-pointer ${tab === n.id ? 'text-indigo-700' : 'text-gray-300'}`}>
            <span className="text-xl">{n.i}</span><span className="text-[9px] font-bold uppercase">{n.id.replace('_',' ')}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AppDashboard;