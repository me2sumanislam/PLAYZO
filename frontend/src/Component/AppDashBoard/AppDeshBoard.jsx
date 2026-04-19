 import React, { useState, useEffect } from 'react';

// --- সাব-কম্পোনেন্টগুলো লেআউট ঠিক রাখার জন্য ---

const PlaySection = ({ onMatchClick }) => {
  const games = [
    { title: 'BR MATCH', count: '21 matches found' },
    { title: 'BR SURVIVAL', count: '13 matches found' },
    { title: 'Clash Squad', count: '24 matches found' },
    { title: 'CS 2 VS 2', count: '29 matches found' },
  ];

  return (
    <div className="pb-10">
      <div className="text-center my-5">
        <h3 className="text-gray-500 font-black tracking-[0.4em] text-sm uppercase">FREE FIRE</h3>
      </div>
      <div className="grid grid-cols-2 gap-4 px-4">
        {games.map((game, index) => (
          <div 
            key={index}
            onClick={() => onMatchClick(game.title)} 
            className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 active:scale-95 transition-all cursor-pointer"
          >
            <div className="h-28 bg-slate-800 flex items-center justify-center text-white font-black italic text-[10px] uppercase p-2 text-center">
              {game.title}
            </div>
            <div className="p-3">
              <h4 className="font-bold text-xs text-slate-800">{game.title}</h4>
              <p className="text-[9px] text-gray-400">{game.count}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// --- মেইন ড্যাশবোর্ড ---

const AppDashboard = ({ onLogout }) => {
  const [activeTab, setActiveTab] = useState('play');
  const [currentSlide, setCurrentSlide] = useState(0);

  // আপনার স্লাইডার ইমেজ (এখানে আপনার ব্যানারের লিঙ্কগুলো দিন)
  const sliderImages = [
    "../../../public/image/img-1.jpg",
    "../../../public/image/img-2.jpg",
    "../../../public/image/img-3.jpg"
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev === sliderImages.length - 1 ? 0 : prev + 1));
    }, 4000);
    return () => clearInterval(timer);
  }, [sliderImages.length]);

  return (
    <div className="bg-[#f3f4f6] min-h-screen max-w-[450px] mx-auto border-x border-gray-200 relative pb-24 shadow-2xl overflow-y-auto font-sans">
      
      {/* --- স্লাইডার সেকশন (আপনার ব্যানারের জায়গায়) --- */}
      <div className="relative w-full h-48 overflow-hidden rounded-b-[2rem] shadow-lg bg-black">
        {sliderImages.map((img, index) => (
          <div
            key={index}
            className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
              index === currentSlide ? 'opacity-100' : 'opacity-0'
            }`}
          >
            <img src={img} alt={`Slide ${index}`} className="w-full h-full object-cover" />
          </div>
        ))}
        {/* স্লাইড ইন্ডিকেটর */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5">
          {sliderImages.map((_, index) => (
            <div
              key={index}
              className={`h-1.5 rounded-full transition-all ${
                index === currentSlide ? 'w-5 bg-orange-500' : 'w-1.5 bg-white/40'
              }`}
            />
          ))}
        </div>
      </div>

      {/* --- কন্টেন্ট এরিয়া --- */}
      <main>
        {activeTab === 'play' && (
          <PlaySection onMatchClick={(name) => alert(name + " matches starting...")} />
        )}
        {activeTab === 'shop' && <div className="p-10 text-center font-bold text-gray-400 mt-20 uppercase">Shop Content</div>}
        {activeTab === 'results' && <div className="p-10 text-center font-bold text-gray-400 mt-20 uppercase">Match Results</div>}
        {activeTab === 'profile' && (
           <div className="p-10 text-center">
             <div className="w-20 h-20 bg-gray-200 rounded-full mx-auto mb-4 flex items-center justify-center text-2xl">👤</div>
             <button onClick={onLogout} className="bg-red-500 text-white px-6 py-2 rounded-xl text-xs font-bold uppercase">Logout</button>
           </div>
        )}
      </main>

      {/* --- বটম নেভিগেশন (একই লেআউট) --- */}
      <div className="fixed bottom-0 w-full max-w-[450px] bg-white border-t border-gray-100 flex justify-around py-3 px-2 z-50 rounded-t-3xl shadow-[0_-5px_20px_rgba(0,0,0,0.08)]">
        <div onClick={() => setActiveTab('shop')} className={`flex flex-col items-center gap-1 cursor-pointer transition-all ${activeTab === 'shop' ? 'text-cyan-600 scale-110' : 'text-gray-400'}`}>
          <span className="text-xl">🏪</span>
          <span className="text-[9px] font-bold">Shop</span>
        </div>

        <div onClick={() => setActiveTab('play')} className={`flex flex-col items-center gap-1 cursor-pointer transition-all ${activeTab === 'play' ? 'text-indigo-700 scale-110' : 'text-gray-400'}`}>
          <div className={`${activeTab === 'play' ? 'bg-indigo-50' : 'bg-transparent'} p-1 px-3 rounded-xl transition-colors`}>
            <span className="text-xl">🎮</span>
          </div>
          <span className="text-[9px] font-black">Play</span>
        </div>

        <div onClick={() => setActiveTab('results')} className={`flex flex-col items-center gap-1 cursor-pointer transition-all ${activeTab === 'results' ? 'text-green-600 scale-110' : 'text-gray-400'}`}>
          <span className="text-xl">📊</span>
          <span className="text-[9px] font-bold">Results</span>
        </div>

        <div onClick={() => setActiveTab('profile')} className={`flex flex-col items-center gap-1 cursor-pointer transition-all ${activeTab === 'profile' ? 'text-purple-600 scale-110' : 'text-gray-400'}`}>
          <span className="text-xl">👤</span>
          <span className="text-[9px] font-bold">Profile</span>
        </div>
      </div>
    </div>
  );
};

export default AppDashboard;