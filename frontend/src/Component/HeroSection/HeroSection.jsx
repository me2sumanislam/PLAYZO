 import React from 'react';

const Hero = () => {
  return (
    // এখানে id="home" যোগ করা হয়েছে নেভিগেশনের জন্য
    <section id="home" className="bg-gradient-to-br from-[#4338ca] via-[#4f46e5] to-[#6366f1] pt-10 pb-20 px-6 overflow-hidden relative">
      
      {/* CSS For Custom Animations */}
      <style>
        {`
          @keyframes float {
            0%, 100% { transform: translateY(0px); }
            50% { transform: translateY(-10px); }
          }
          .animate-custom-float {
            animation: float 3s ease-in-out infinite;
          }
        `}
      </style>

      {/* Background Decorative Element */}
      <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-96 h-96 bg-white/5 rounded-full blur-3xl"></div>

      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-12 relative z-10">
        
        {/* Left Content Section */}
        <div className="w-full md:w-1/2 text-center md:text-left order-2 md:order-1">
          <h1 className="text-4xl md:text-6xl font-black text-white leading-[1.1]">
            বাংলাদেশের সেরা <br />
            <span className="text-[#ff8a00]">টুর্নামেন্ট</span> <br />
            অ্যাপ
          </h1>

          {/* Floating Game Tags Section */}
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 mt-6">
            {[
              { name: 'Free Fire', color: 'bg-red-500', glow: '#ef4444' },
              { name: 'PUBG', color: 'bg-yellow-500', glow: '#eab308' },
              { name: 'Ludo', color: 'bg-blue-500', glow: '#3b82f6' }
            ].map((game, index) => (
              <div 
                key={index}
                className="animate-custom-float"
                style={{ animationDelay: `${index * 0.4}s` }}
              >
                <span className="cursor-default bg-white/10 backdrop-blur-md border border-white/20 text-white text-xs md:text-sm px-4 py-2 rounded-full flex items-center gap-2 shadow-lg transition-transform active:scale-90">
                  <span 
                    className={`w-2.5 h-2.5 ${game.color} rounded-full animate-pulse`}
                    style={{ boxShadow: `0 0 10px ${game.glow}` }}
                  ></span>
                  <span className="font-bold tracking-wide">{game.name}</span>
                </span>
              </div>
            ))}

            {/* + আরও অনেক গেম */}
            <div className="animate-custom-float" style={{ animationDelay: '1.2s' }}>
              <span className="cursor-pointer bg-white/5 border border-white/10 text-gray-200 text-xs md:text-sm px-4 py-2 rounded-full flex items-center gap-1.5 hover:bg-white/10 hover:text-white transition-all shadow-lg active:scale-95">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-[#ff8a00]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 4v16m8-8H4" />
                </svg>
                <span className="italic font-medium">আরও অনেক গেম</span>
              </span>
            </div>
          </div>
          
          <p className="mt-8 text-indigo-50 font-medium text-base md:text-lg max-w-xl mx-auto md:mx-0 opacity-90 leading-relaxed">
            প্রতিদিন নতুন টুর্নামেন্ট, বিশাল পুরস্কার এবং অসাধারণ গেমিং অভিজ্ঞতা। বাংলাদেশের সবচেয়ে বড় গেমিং কমিউনিটিতে আজই যোগ দিন।
          </p>

          {/* Action Buttons */}
          <div className="mt-10 flex flex-col sm:flex-row gap-5 justify-center md:justify-start">
            <button className="bg-[#ff8a00] hover:bg-orange-600 px-10 py-4 rounded-2xl font-black text-white shadow-[0_10px_30px_rgba(0,0,0,0.3)] transition-all transform active:scale-95">
              এখনই ডাউনলোড করুন
            </button>
            <button className="bg-white/10 hover:bg-white/20 border-2 border-white/20 px-10 py-4 rounded-2xl font-bold text-white backdrop-blur-sm transition-all active:scale-95">
              ভিডিও দেখুন
            </button>
          </div>

          {/* Stats Bar */}
          <div className="mt-12 grid grid-cols-3 gap-6 border-t border-white/20 pt-8">
            <div className="text-center md:text-left">
              <span className="block text-2xl md:text-3xl font-black text-white">00</span>
              <span className="text-[10px] md:text-xs text-indigo-200 uppercase tracking-widest font-bold">দৈনিক টুর্নামেন্ট</span>
            </div>
            <div className="text-center md:text-left">
              <span className="block text-2xl md:text-3xl font-black text-white">000</span>
              <span className="text-[10px] md:text-xs text-indigo-200 uppercase tracking-widest font-bold">সক্রিয় খেলোয়াড়</span>
            </div>
            <div className="text-center md:text-left">
              <span className="block text-2xl md:text-3xl font-black text-white">000</span>
              <span className="text-[10px] md:text-xs text-indigo-200 uppercase tracking-widest font-bold">পুরস্কার বিতরণ</span>
            </div>
          </div>
        </div>

        {/* Right Phone Mockup Section */}
        <div className="w-full md:w-1/2 flex justify-center order-1 md:order-2">
          <div className="relative group">
            <div className="absolute -inset-10 bg-orange-500/20 blur-[100px] rounded-full group-hover:bg-orange-500/30 transition-all duration-1000"></div>
            
            <div className="relative w-[280px] md:w-[330px] aspect-[9/18.5] bg-[#020617] rounded-[3rem] border-[10px] border-[#1e293b] shadow-2xl overflow-hidden ring-4 ring-white/5">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-[#1e293b] rounded-b-2xl z-20"></div>
              
              <div className="h-full w-full bg-slate-50 flex flex-col items-center justify-center p-8 text-center">
                <div className="w-24 h-24 bg-gradient-to-tr from-[#ff3d00] to-[#ff8a00] rounded-[2rem] flex items-center justify-center shadow-2xl mb-6">
                  {/* লোগো টেক্সট আপডেট করা হয়েছে */}
                  <span className="text-white font-black text-base leading-tight uppercase tracking-tighter">
                    uthi<br/>YO
                  </span>
                </div>
                <div className="w-full h-4 bg-gray-200 rounded-full mb-3"></div>
                <div className="w-4/5 h-4 bg-gray-100 rounded-full"></div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
};

export default Hero;