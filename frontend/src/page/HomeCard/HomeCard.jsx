 // page/HomeCard/HomeCard.jsx
import React, { useState, useEffect } from 'react';

const API_BASE = import.meta.env.VITE_API_URL || "https://playzo-vn8e.onrender.com/api";
const CLEAN_API_URL = API_BASE.endsWith("/api") ? API_BASE : `${API_BASE}/api`;

const services = [
  {
    title: '১০০% স্বচ্ছ প্ল্যাটফর্ম',
    desc: 'কথা দিলে কথা রাখি। কোনো প্রতারণা নয়, শুধু স্বচ্ছ ও নির্ভরযোগ্য সার্ভিস।',
  },
  {
    title: 'দ্রুত পেমেন্ট',
    desc: 'বিকাশ, নগদ, রকেট, ব্যাংক — সব মাধ্যমে ইনস্ট্যান্ট ডিপোজিট ও উইথড্রয়াল।',
  },
  {
    title: '২৪/৭ লাইভ সাপোর্ট',
    desc: 'আমাদের টিম সবসময় অনলাইনে। যেকোনো সমস্যায় তাৎক্ষণিক রেসপন্স পাবেন।',
  },
  {
    title: 'সক্রিয় কমিউনিটি',
    desc: 'টেলিগ্রাম ও ফেসবুক গ্রুপ ২৪ ঘণ্টা সক্রিয়। আপডেট, টিপস ও সাপোর্ট পাবেন সবসময়।',
  },
  {
    title: 'নিরাপদ গেমিং',
    desc: 'অত্যাধুনিক সিকিউরিটি দিয়ে আপনার অ্যাকাউন্ট ও টাকা সম্পূর্ণ সুরক্ষিত।',
  },
  {
    title: 'বড় প্রাইজপুল',
    desc: 'নিয়মিত আকর্ষণীয় টুর্নামেন্ট ও বড় প্রাইজপুল, প্রতিদিন ভালো রিওয়ার্ড।',
  },
];

const membership = [
  {
    title: 'দ্রুত পেমেন্ট',
    desc: 'ব্যাংক, বিকাশ, নগদ, রকেট — সব মাধ্যমে তাৎক্ষণিক লেনদেন। কোনো অপেক্ষা নেই!',
  },
  {
    title: '২৪/৭ লাইভ সাপোর্ট',
    desc: 'দিন-রাত ২৪ ঘণ্টা লাইভ সাপোর্ট টিম। যেকোনো সমস্যায় তাৎক্ষণিক হেল্প পাবেন।',
  },
  {
    title: 'নিরাপদ গেমিং',
    desc: 'অত্যাধুনিক এনক্রিপশন ও সিকিউরিটি সিস্টেম। নিরাপদে খেলুন!',
  },
];

// ── একটা হাইলাইট কার্ড (notice / announcement / top_player) ──
const HighlightCard = ({ card }) => {
  if (card.type === "top_player") {
    return (
      <div className="bg-[#2a1f66]/70 border border-white/10 rounded-lg p-5 md:p-6 text-white backdrop-blur-sm hover:border-[#ff5a1f]/50 transition-all flex flex-col items-center text-center">
        {card.badgeText && (
          <div className="self-end -mt-1 -mr-1 mb-2 bg-[#d1373f]/20 text-[#ff8890] px-2.5 py-1 text-[10px] font-bold tracking-widest rounded">
            {card.badgeText}
          </div>
        )}
        <img
          src={card.imageUrl || "https://via.placeholder.com/96?text=Player"}
          alt={card.title}
          className="w-24 h-24 rounded-full object-cover border-2 border-[#ff5a1f] mb-4"
        />
        <h3 className="font-arena text-lg font-bold uppercase tracking-wide">
          {card.title}
        </h3>
        {card.body && (
          <p className="text-[#c9bdfa]/80 text-sm mt-1 mb-4">{card.body}</p>
        )}
        <div className="flex items-center gap-4 text-sm text-[#e4defc] mt-2">
          <div className="flex items-center gap-1.5">
            <span className="bg-white/10 p-1.5 rounded-lg">🎯</span> {card.kills ?? 0} kills
          </div>
          <div className="flex items-center gap-1.5">
            <span className="bg-white/10 p-1.5 rounded-lg">🎮</span> {card.matches ?? 0} matches
          </div>
        </div>
      </div>
    );
  }

  // notice / announcement
  const isNotice = card.type === "notice";
  return (
    <div className="bg-[#2a1f66]/70 border border-white/10 rounded-lg p-5 md:p-6 text-white backdrop-blur-sm hover:border-[#ff5a1f]/50 transition-all">
      <div className="flex justify-between items-start mb-4">
        <h3 className="font-arena text-lg font-bold uppercase tracking-wide">
          {isNotice ? "📋 নোটিশ" : "📢 ঘোষণা"}
        </h3>
        {card.badgeText && (
          <div className="flex items-center gap-1.5 bg-[#d1373f]/20 text-[#ff8890] px-2.5 py-1 text-[10px] font-bold tracking-widest rounded">
            {card.badgeText}
          </div>
        )}
      </div>

      {card.title && (
        <h4 className="font-arena text-base font-semibold text-[#ff5a1f] mb-3">
          {card.title}
        </h4>
      )}

      <p className="text-sm text-[#e4defc] leading-relaxed whitespace-pre-line">
        {card.body}
      </p>
    </div>
  );
};

const HomeCard = () => {
  const [highlights, setHighlights] = useState([]);
  const [loadingHighlights, setLoadingHighlights] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const loadHighlights = async () => {
      try {
        const res = await fetch(`${CLEAN_API_URL}/home-highlights`);
        const data = await res.json();
        if (!cancelled && data?.success) setHighlights(data.data || []);
      } catch {
        // silent — ব্যর্থ হলে সেকশনটা খালি থাকবে, বাকি হোমপেজ স্বাভাবিক থাকবে
      } finally {
        if (!cancelled) setLoadingHighlights(false);
      }
    };
    loadHighlights();
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="w-full">
      {/* CSS For font + animations */}
      <style>
        {`
          @import url('https://fonts.googleapis.com/css2?family=Rajdhani:wght@600;700&display=swap');
          .font-arena { font-family: 'Rajdhani', sans-serif; }
        `}
      </style>

      {/* === Features Section === */}
      <section id="features" className="bg-gradient-to-br from-[#241b5e] to-[#3d2470] py-14 md:py-20 px-4 sm:px-6 scroll-mt-20">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-10 md:mb-14">
            <span className="font-arena text-[#ff5a1f] text-xs md:text-sm font-bold tracking-[0.3em] uppercase">
              কেন uthiYO
            </span>
            <h2 className="mt-2 text-2xl md:text-4xl font-black text-white">
              আমাদের বিশেষত্ব
            </h2>
            <div className="w-16 h-1 bg-[#ff5a1f] mx-auto mt-4" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6">
            {services.map((s, i) => (
              <div
                key={i}
                className="bg-[#2a1f66]/70 border border-white/10 border-l-2 border-l-[#ff5a1f] p-6 md:p-7 backdrop-blur-sm hover:border-l-white transition-colors"
              >
                <span className="font-arena text-[#c9bdfa] text-xs font-bold tracking-widest">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <h3 className="text-lg md:text-xl font-bold text-white mt-2 mb-3">
                  {s.title}
                </h3>
                <p className="text-[#c9bdfa]/80 text-sm leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* === Home Highlights Section (notice / announcement / top player) === */}
      {!loadingHighlights && highlights.length > 0 && (
        <section
          id="tournaments"
          className="bg-gradient-to-br from-[#1e1650] to-[#402a7a] py-14 md:py-20 px-4 sm:px-6 scroll-mt-20 relative overflow-hidden"
        >
          <div className="pointer-events-none absolute -top-24 left-1/3 w-[40rem] h-[40rem] bg-[#ff5a1f]/10 blur-[120px] rounded-full" />

          <div className="max-w-7xl mx-auto relative z-10">
            <div className="text-center mb-10 md:mb-14">
              <h2 className="text-2xl md:text-4xl font-black text-white">
                সর্বশেষ আপডেট
              </h2>
              <p className="text-[#c9bdfa] mt-2 text-sm md:text-base">
                নোটিশ, ঘোষণা ও সপ্তাহের সেরা প্লেয়াররা
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6">
              {highlights.map((card) => (
                <HighlightCard key={card.id} card={card} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* === Membership Section === */}
      <section id="membership" className="bg-gradient-to-br from-[#241b5e] to-[#3d2470] py-16 md:py-20 px-4 sm:px-6 scroll-mt-20">
        <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {membership.map((card, index) => (
            <div
              key={index}
              className="bg-[#2a1f66]/70 border border-white/10 rounded-lg p-8 md:p-10 text-center backdrop-blur-sm hover:border-[#ff5a1f]/50 transition-all"
            >
              <div className="w-14 h-14 mx-auto mb-6 bg-[#ff5a1f]/10 border border-[#ff5a1f]/40 rounded-full flex items-center justify-center">
                <span className="font-arena text-[#ff5a1f] font-black text-xl">
                  {String(index + 1).padStart(2, '0')}
                </span>
              </div>
              <h3 className="text-xl md:text-2xl font-black text-white mb-4">
                {card.title}
              </h3>
              <p className="text-[#c9bdfa]/80 leading-relaxed text-sm md:text-[15px]">
                {card.desc}
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default HomeCard;