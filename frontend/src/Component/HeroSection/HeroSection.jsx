import React from 'react';

const Hero = () => {
  return (
    <section className="bg-gradient-to-b from-[#4338ca] to-[#312e81] pt-10 pb-20 px-6 overflow-hidden">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-12">
        
        {/* Left Content (Mobile-এ নিচে যাবে) */}
        <div className="w-full md:w-1/2 text-center md:text-left order-2 md:order-1">
          <h1 className="text-4xl md:text-6xl font-black text-white leading-[1.1]">
            বাংলাদেশের সেরা <br />
            <span className="text-[#ff8a00]">ফ্রি ফায়ার টুর্নামেন্ট</span> <br />
            অ্যাপ
          </h1>
          
          <p className="mt-6 text-gray-200 text-base md:text-lg max-w-xl mx-auto md:mx-0">
            প্রতিদিন নতুন টুর্নামেন্ট, বিশাল পুরস্কার এবং অসাধারণ গেমিং অভিজ্ঞতা। বাংলাদেশের সবচেয়ে বড় ফ্রি ফায়ার কমিউনিটিতে আজই যোগ দিন।
          </p>

          {/* Action Buttons */}
          <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
            <button className="bg-[#ff8a00] hover:bg-orange-600 px-8 py-4 rounded-xl font-bold text-white shadow-xl transition-transform active:scale-95">
              এখনই ডাউনলোড করুন
            </button>
            <button className="bg-white/10 hover:bg-white/20 border border-white/20 px-8 py-4 rounded-xl font-bold text-white backdrop-blur-sm transition-all">
              ভিডিও দেখুন
            </button>
          </div>

          {/* Counter/Stats Section */}
          <div className="mt-12 grid grid-cols-3 gap-4 border-t border-white/10 pt-8">
            <div className="text-center md:text-left">
              <span className="block text-2xl font-black text-white">১০০+</span>
              <span className="text-[10px] md:text-xs text-indigo-300 uppercase tracking-wider font-semibold">দৈনিক টুর্নামেন্ট</span>
            </div>
            <div className="text-center md:text-left">
              <span className="block text-2xl font-black text-white">৫০,০০০+</span>
              <span className="text-[10px] md:text-xs text-indigo-300 uppercase tracking-wider font-semibold">সক্রিয় খেলোয়াড়</span>
            </div>
            <div className="text-center md:text-left">
              <span className="block text-2xl font-black text-white">১০ লক্ষ+</span>
              <span className="text-[10px] md:text-xs text-indigo-300 uppercase tracking-wider font-semibold">পুরস্কার বিতরণ</span>
            </div>
          </div>
        </div>

        {/* Right Phone Mockup (Mobile-এ উপরে থাকবে) */}
        <div className="w-full md:w-1/2 flex justify-center order-1 md:order-2">
          <div className="relative group">
            {/* Soft Glow effect */}
            <div className="absolute -inset-10 bg-indigo-500/20 blur-[100px] rounded-full group-hover:bg-indigo-500/30 transition-all duration-700"></div>
            
            {/* Phone Frame */}
            <div className="relative w-[270px] md:w-[320px] aspect-[9/18.5] bg-[#020617] rounded-[3rem] border-[10px] border-[#1e293b] shadow-[0_0_50px_rgba(0,0,0,0.4)] overflow-hidden">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-[#1e293b] rounded-b-2xl z-20"></div>
              
              {/* Screen Content */}
              <div className="h-full w-full bg-slate-50 flex flex-col items-center justify-center p-8">
                <div className="w-24 h-24 bg-[#ff3d00] rounded-3xl flex items-center justify-center shadow-2xl rotate-3 group-hover:rotate-0 transition-transform duration-500">
                  <span className="text-white font-black text-center text-xs leading-tight">uthiyo<br/>BANGLADESH</span>
                </div>
                <div className="mt-6 w-3/4 h-2 bg-slate-200 rounded-full"></div>
                <div className="mt-3 w-1/2 h-2 bg-slate-200 rounded-full"></div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
};

export default Hero;