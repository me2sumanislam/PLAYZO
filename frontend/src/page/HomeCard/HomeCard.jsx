 import React from 'react';

const HomeCard = () => {
  return (
    <div className="w-full">
      {/* CSS For Animations */}
      <style>
        {`
          @keyframes float-slow {
            0%, 100% { transform: translateY(0px); }
            50% { transform: translateY(-12px); }
          }
          .animate-card-float {
            animation: float-slow 4s ease-in-out infinite;
          }
        `}
      </style>

      {/* --- Section 1: Off-White Background (Features) --- */}
      <section className="bg-[#f8fafc] py-16 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-black text-slate-800">আমাদের বিশেষত্ব</h2>
            <div className="w-20 h-1.5 bg-[#ff8a00] mx-auto mt-4 rounded-full"></div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[1, 2, 3, 4, 5, 6].map((item) => (
              <div key={item} className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
                <h3 className="text-xl font-bold text-slate-800 mb-3">সেরা সার্ভিস {item}</h3>
                <p className="text-slate-600 leading-relaxed">
                  আমরা দিচ্ছি বাংলাদেশের সবচেয়ে দ্রুত পেমেন্ট সিস্টেম এবং ২৪/৭ কাস্টমার সাপোর্ট।
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* --- Section 2: Hero Gradient Background (Live Tournaments) --- */}
      <section className="bg-gradient-to-br from-[#4338ca] via-[#4f46e5] to-[#6366f1] py-16 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-black text-white">চলমান টুর্নামেন্ট</h2>
            <p className="text-indigo-100 mt-2">আপনার প্রিয় গেমটি বেছে নিন এবং অংশ নিন</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((item) => (
              <div key={item} className="bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl p-6 text-white hover:bg-white/15 transition-all">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-xl font-bold uppercase tracking-wide">Free Fire</h3>
                  <div className="flex items-center gap-1.5 bg-red-500 px-3 py-1 rounded-full text-[10px] font-bold animate-pulse">
                    <span className="w-1.5 h-1.5 bg-white rounded-full"></span> LIVE
                  </div>
                </div>

                <h4 className="text-lg font-semibold text-orange-400 mb-4">Solo Pro League</h4>

                <ul className="space-y-3 mb-6">
                  <li className="flex items-center gap-3 text-sm text-indigo-50">
                    <span className="bg-white/10 p-1.5 rounded-lg">👥</span> ৪৮ জন জয়েন করেছে
                  </li>
                  <li className="flex items-center gap-3 text-sm text-indigo-50">
                    <span className="bg-white/10 p-1.5 rounded-lg">⏰</span> রাত ৯:৩০ মিনিট
                  </li>
                  <li className="flex items-center gap-3 text-sm text-indigo-50">
                    <span className="bg-white/10 p-1.5 rounded-lg">🏆</span> প্রাইজপুল: ৫০০০৳
                  </li>
                </ul>

                <button className="w-full bg-[#ff8a00] hover:bg-orange-600 py-3 rounded-xl font-bold transition-all transform active:scale-95 shadow-lg">
                  যোগ দিন
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* --- Section 3: Floating Cards (Specials) --- */}
      <section className="bg-white py-20 px-6 overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {[
              { title: 'দ্রুত পেমেন্ট', icon: '🚀', color: 'border-orange-200' },
              { title: '২৪/৭ সাপোর্ট', icon: '📞', color: 'border-indigo-200' },
              { title: 'নিরাপদ গেমিং', icon: '🛡️', color: 'border-green-200' }
            ].map((card, index) => (
              <div 
                key={index} 
                className={`animate-card-float bg-white border-2 ${card.color} p-10 rounded-[2.5rem] text-center shadow-xl shadow-slate-100`}
                style={{ animationDelay: `${index * 0.5}s` }}
              >
                <div className="text-5xl mb-6">{card.icon}</div>
                <h3 className="text-2xl font-black text-slate-800 mb-4">{card.title}</h3>
                <p className="text-slate-500">
                  আমরা নিশ্চিত করি আপনার গেমিং অভিজ্ঞাতা যেন হয় একদম নিরবচ্ছিন্ন।
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomeCard;