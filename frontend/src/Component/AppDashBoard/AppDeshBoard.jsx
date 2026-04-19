 import React, { useState, useEffect } from 'react';

// --- ১. কাউন্টডাউন টাইমার মেকানিজম (এটি আলাদা করে তৈরি করা হয়েছে যাতে মূল কোডে প্রভাব না পড়ে) ---
const CountdownTimer = ({ startMinutes }) => {
  const [seconds, setSeconds] = useState(parseInt(startMinutes) * 60 || 0);

  useEffect(() => {
    if (seconds <= 0) return;
    const interval = setInterval(() => {
      setSeconds((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [seconds]);

  if (seconds <= 0) return <span>Started</span>;

  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return <span>{h > 0 ? `${h}h:` : ""}{m < 10 ? "0" + m : m}m:{s < 10 ? "0" + s : s}s</span>;
};

// --- ২. ম্যাচ লিস্ট কম্পোনেন্ট (হুবহু আপনার দেওয়া ডিজাইন) ---
const MatchList = ({ matches, onBack }) => {
  return (
    <div className="bg-[#fcfaff] min-h-screen max-w-[450px] mx-auto pb-20">
      <div className="flex items-center px-4 py-4 bg-white sticky top-0 z-10 shadow-sm border-b">
        <button onClick={onBack} className="text-xl mr-4 text-slate-800">❮</button>
        <h2 className="text-lg font-black uppercase tracking-tighter text-slate-800">BR MATCHES</h2>
      </div>

      <div className="px-3 py-4 space-y-5">
        {matches.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-400 font-bold italic">No active matches found!</p>
            <p className="text-[10px] text-gray-300 uppercase">Add matches from Admin Panel (⚙️)</p>
          </div>
        ) : (
          matches.map((match) => (
            <div key={match.id} className="bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden transition-all">
              <div className="flex gap-3 p-3">
                <div className="w-24 h-16 bg-indigo-900 rounded-lg flex items-center justify-center text-white text-[10px] font-black uppercase italic">
                  Free Fire
                </div>
                <div>
                  <h3 className="font-black text-sm text-slate-800 leading-tight">{match.title} | {match.version}</h3>
                  <p className="text-[10px] text-red-500 font-bold mt-1">{match.time}</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-y-4 px-4 py-2 border-t border-gray-50 text-center">
                <div><p className="text-[9px] text-gray-400 font-bold uppercase tracking-tighter">Win Prize</p><p className="text-xs font-black">{match.winPrize} TK</p></div>
                <div><p className="text-[9px] text-gray-400 font-bold uppercase tracking-tighter">Entry Type</p><p className="text-xs font-black">{match.entryType}</p></div>
                <div><p className="text-[9px] text-gray-400 font-bold uppercase tracking-tighter">Entry Fee</p><p className="text-xs font-black">{match.entryFee} TK</p></div>
                <div><p className="text-[9px] text-gray-400 font-bold uppercase tracking-tighter">Per Kill</p><p className="text-xs font-black">{match.perKill} TK</p></div>
                <div><p className="text-[9px] text-gray-400 font-bold uppercase tracking-tighter">Map</p><p className="text-xs font-black">{match.map}</p></div>
                <div><p className="text-[9px] text-gray-400 font-bold uppercase tracking-tighter">Version</p><p className="text-xs font-black">{match.version}</p></div>
              </div>

              <div className="px-4 py-3 flex items-center gap-4 border-t border-gray-50">
                <div className="flex-1">
                  <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                    <div className="bg-green-500 h-full transition-all duration-700" style={{ width: `${(match.joined/match.total)*100}%` }}></div>
                  </div>
                  <div className="flex justify-between mt-1 text-[9px] font-bold text-gray-400">
                    <span>Only {match.total - match.joined} spots left</span>
                    <span>{match.joined}/{match.total}</span>
                  </div>
                </div>
                <button className="px-5 py-1.5 rounded-lg border-2 border-indigo-600 text-indigo-600 text-[10px] font-black uppercase active:scale-95 transition-all">Join</button>
              </div>

              <div className="grid grid-cols-2 gap-2 px-3 py-2 bg-gray-50 text-[9px] font-black uppercase tracking-tighter text-indigo-700">
                 <button className="bg-white border border-indigo-100 py-1.5 rounded-md shadow-sm active:bg-indigo-50">🔑 Room Details</button>
                 <button className="bg-white border border-indigo-100 py-1.5 rounded-md shadow-sm active:bg-indigo-50">🏆 Prize Details</button>
              </div>

              <div className="bg-green-600 text-white text-center py-2 text-[10px] font-bold uppercase tracking-widest">
                Starts In - <CountdownTimer startMinutes={match.startsIn} />
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

// --- ৩. অ্যাডমিন প্যানেল (হুবহু এক রাখা হয়েছে) ---
const AdminPanel = ({ onAddMatch, onBack }) => {
  const [form, setForm] = useState({
    title: '', winPrize: '', entryFee: '', perKill: '', 
    time: '2026-04-19 at 10:00 PM', total: 48, map: 'Bermuda', startsIn: '30' // এখানে শুধু মিনিট দিলেই হবে
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onAddMatch({ ...form, id: Date.now(), joined: 0, version: 'MOBILE', type: 'Regular', entryType: 'Solo' });
    alert("Match Published Successfully!");
    onBack();
  };

  return (
    <div className="p-6 bg-white min-h-screen max-w-[450px] mx-auto border-x border-gray-200">
      <div className="flex justify-between items-center mb-8 border-b pb-4">
        <h2 className="text-2xl font-black text-indigo-600 tracking-tighter">ADMIN PANEL</h2>
        <button onClick={onBack} className="bg-red-50 text-red-500 px-4 py-1 rounded-full font-bold text-xs uppercase">Exit</button>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Match Name</label>
          <input type="text" placeholder="Solo Pro League" className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl focus:outline-indigo-500" onChange={e => setForm({...form, title: e.target.value})} required />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <input type="number" placeholder="Win Prize" className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl focus:outline-indigo-500" onChange={e => setForm({...form, winPrize: e.target.value})} required />
          <input type="number" placeholder="Entry Fee" className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl focus:outline-indigo-500" onChange={e => setForm({...form, entryFee: e.target.value})} required />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <input type="number" placeholder="Per Kill" className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl focus:outline-indigo-500" onChange={e => setForm({...form, perKill: e.target.value})} required />
          <input type="text" placeholder="Map (Bermuda)" className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl focus:outline-indigo-500" onChange={e => setForm({...form, map: e.target.value})} required />
        </div>
        <input type="text" placeholder="Match Time (Date & Time)" className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl focus:outline-indigo-500" onChange={e => setForm({...form, time: e.target.value})} required />
        
        <div>
          <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Starts In (Minutes Only)</label>
          <input type="number" placeholder="Example: 30" className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl focus:outline-indigo-500" onChange={e => setForm({...form, startsIn: e.target.value})} required />
        </div>
        
        <button type="submit" className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-black shadow-lg mt-6 active:scale-95 transition-all">
          CREATE NEW MATCH
        </button>
      </form>
    </div>
  );
};

// --- ৪. মেইন ড্যাশবোর্ড (হুবহু এক রাখা হয়েছে) ---
const AppDashboard = ({ onLogout }) => {
  const [activeTab, setActiveTab] = useState('play');
  const [currentSlide, setCurrentSlide] = useState(0);
  const [currentView, setCurrentView] = useState('home'); 
  const [matches, setMatches] = useState([]); 

  const sliderImages = ["/image/img-1.jpg", "/image/img-2.jpg", "/image/img-3.jpg"];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev === sliderImages.length - 1 ? 0 : prev + 1));
    }, 4000);
    return () => clearInterval(timer);
  }, [sliderImages.length]);

  const addMatch = (newMatch) => {
    setMatches([newMatch, ...matches]);
  };

  if (currentView === 'br_list') {
    return <MatchList matches={matches} onBack={() => setCurrentView('home')} />;
  }
  if (currentView === 'admin') {
    return <AdminPanel onAddMatch={addMatch} onBack={() => setCurrentView('home')} />;
  }

  return (
    <div className="bg-[#f3f4f6] min-h-screen max-w-[450px] mx-auto border-x border-gray-200 relative pb-24 shadow-2xl overflow-y-auto font-sans">
      
      <div className="absolute top-4 right-4 z-50">
        <button onClick={() => setCurrentView('admin')} className="w-10 h-10 bg-white/90 backdrop-blur-md rounded-full flex items-center justify-center shadow-lg border border-white active:scale-90 transition-all text-xl">
          ⚙️
        </button>
      </div>

      <div className="relative w-full h-48 overflow-hidden rounded-b-[3rem] shadow-lg bg-slate-900">
        {sliderImages.map((img, index) => (
          <div key={index} className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${index === currentSlide ? 'opacity-100' : 'opacity-0'}`}>
            <img src={img} alt={`Slide ${index}`} className="w-full h-full object-cover opacity-80" />
          </div>
        ))}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-1.5">
          {sliderImages.map((_, index) => (
            <div key={index} className={`h-1.5 rounded-full transition-all ${index === currentSlide ? 'w-6 bg-orange-500' : 'w-1.5 bg-white/40'}`} />
          ))}
        </div>
      </div>

      <main>
        {activeTab === 'play' && (
          <div className="pb-10">
            <div className="bg-orange-100 border-y border-orange-200 py-2 overflow-hidden mt-4 relative">
              <div className="flex whitespace-nowrap" style={{ display: 'flex', width: 'max-content', animation: 'marquee 25s linear infinite' }}>
                <span className="text-orange-600 text-[11px] font-bold px-4 uppercase tracking-wider">
                  📢 স্বাগতম uthiYO-তে! আমাদের অ্যাপে টুর্নামেন্ট খেলে জিতে নিন আকর্ষণীয় পুরষ্কার। যে কোনো সমস্যায় যোগাযোগ করুন।
                </span>
                <span className="text-orange-600 text-[11px] font-bold px-4 uppercase tracking-wider">
                  📢 স্বাগতম uthiYO-তে! আমাদের অ্যাপে টুর্নামেন্ট খেলে জিতে নিন আকর্ষণীয় পুরষ্কার। যে কোনো সমস্যায় যোগাযোগ করুন।
                </span>
              </div>
              <style dangerouslySetInnerHTML={{ __html: `@keyframes marquee { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }`}} />
            </div>

            <div className="text-center my-6">
              <h3 className="text-gray-400 font-black tracking-[0.5em] text-[10px] uppercase">GAMES CATEGORY</h3>
            </div>
            
            <div className="grid grid-cols-2 gap-4 px-4">
              <div onClick={() => setCurrentView('br_list')} className="bg-white rounded-3xl overflow-hidden shadow-sm border border-gray-100 active:scale-95 transition-all cursor-pointer">
                <div className="h-24 bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center text-white font-black italic text-xs uppercase p-2 text-center tracking-tighter">
                  BR MATCH
                </div>
                <div className="p-3 text-center uppercase tracking-tighter">
                  <h4 className="font-black text-[11px] text-slate-800">BR Tournament</h4>
                  <p className="text-[9px] text-green-500 font-bold mt-0.5">{matches.length} active matches</p>
                </div>
              </div>

              <div className="bg-white rounded-3xl overflow-hidden shadow-sm border border-gray-100 opacity-50 cursor-not-allowed">
                <div className="h-24 bg-slate-200 flex items-center justify-center text-gray-400 font-black italic text-xs uppercase p-2 text-center tracking-tighter">
                  CLASH SQUAD
                </div>
                <div className="p-3 text-center uppercase tracking-tighter">
                  <h4 className="font-bold text-[11px] text-gray-400">Coming Soon</h4>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      <div className="fixed bottom-0 w-full max-w-[450px] bg-white border-t border-gray-100 flex justify-around py-3 px-2 z-50 rounded-t-3xl shadow-[0_-10px_25px_rgba(0,0,0,0.05)]">
        <div onClick={() => setActiveTab('shop')} className={`flex flex-col items-center gap-1 cursor-pointer ${activeTab === 'shop' ? 'text-cyan-600' : 'text-gray-300'}`}>
          <span className="text-xl">🏪</span><span className="text-[9px] font-bold uppercase">Shop</span>
        </div>
        <div onClick={() => setActiveTab('play')} className={`flex flex-col items-center gap-1 cursor-pointer ${activeTab === 'play' ? 'text-indigo-700' : 'text-gray-300'}`}>
          <div className={`${activeTab === 'play' ? 'bg-indigo-50' : ''} p-1 px-4 rounded-2xl transition-all`}><span className="text-xl">🎮</span></div>
          <span className="text-[9px] font-black uppercase tracking-tighter">Play</span>
        </div>
        <div onClick={() => setActiveTab('results')} className={`flex flex-col items-center gap-1 cursor-pointer ${activeTab === 'results' ? 'text-green-600' : 'text-gray-300'}`}>
          <span className="text-xl">📊</span><span className="text-[9px] font-bold uppercase">Results</span>
        </div>
        <div onClick={() => setActiveTab('profile')} className={`flex flex-col items-center gap-1 cursor-pointer ${activeTab === 'profile' ? 'text-purple-600' : 'text-gray-300'}`}>
          <span className="text-xl">👤</span><span className="text-[9px] font-bold uppercase">Profile</span>
        </div>
      </div>
    </div>
  );
};

export default AppDashboard;