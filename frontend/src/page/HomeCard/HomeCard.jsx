import React from 'react';

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

const HomeCard = () => {
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
      <section id="features" className="bg-[#120e0c] py-14 md:py-20 px-4 sm:px-6 scroll-mt-20">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-10 md:mb-14">
            <span className="font-arena text-[#c9a227] text-xs md:text-sm font-bold tracking-[0.3em] uppercase">
              কেন uthiYO
            </span>
            <h2 className="mt-2 text-2xl md:text-4xl font-black text-[#f3ede6]">
              আমাদের বিশেষত্ব
            </h2>
            <div className="w-16 h-1 bg-[#ff5a1f] mx-auto mt-4" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6">
            {services.map((s, i) => (
              <div
                key={i}
                className="bg-[#1c1512] border border-white/5 border-l-2 border-l-[#ff5a1f] p-6 md:p-7 hover:border-l-[#c9a227] transition-colors"
              >
                <span className="font-arena text-[#c9a227]/70 text-xs font-bold tracking-widest">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <h3 className="text-lg md:text-xl font-bold text-[#f3ede6] mt-2 mb-3">
                  {s.title}
                </h3>
                <p className="text-[#9c8f86] text-sm leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* === Live Tournaments Section === */}
      <section
        id="tournaments"
        className="bg-[#0e0b09] py-14 md:py-20 px-4 sm:px-6 scroll-mt-20 relative overflow-hidden"
      >
        <div className="pointer-events-none absolute -top-24 left-1/3 w-[40rem] h-[40rem] bg-[#ff5a1f]/5 blur-[120px] rounded-full" />

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center mb-10 md:mb-14">
            <h2 className="text-2xl md:text-4xl font-black text-[#f3ede6]">
              চলমান টুর্নামেন্ট
            </h2>
            <p className="text-[#9c8f86] mt-2 text-sm md:text-base">
              আপনার প্রিয় গেমটি বেছে নিন এবং অংশ নিন
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6">
            {[1, 2, 3, 4, 5, 6].map((item) => (
              <div
                key={item}
                className="bg-[#1c1512] border border-white/10 rounded-lg p-5 md:p-6 text-[#f3ede6] hover:border-[#c9a227]/40 transition-all"
              >
                <div className="flex justify-between items-start mb-4">
                  <h3 className="font-arena text-lg font-bold uppercase tracking-wide">
                    Free Fire
                  </h3>
                  <div className="flex items-center gap-1.5 bg-[#d1373f]/15 text-[#e8626a] px-2.5 py-1 text-[10px] font-bold tracking-widest">
                    <span className="w-1.5 h-1.5 bg-[#d1373f] rounded-full animate-pulse" /> LIVE
                  </div>
                </div>

                <h4 className="font-arena text-base font-semibold text-[#ff5a1f] mb-4">
                  Solo Pro League
                </h4>

                <ul className="space-y-2.5 mb-6 text-sm text-[#c9beb6]">
                  <li className="flex items-center gap-3">
                    <span className="bg-white/5 p-1.5 rounded-lg">👥</span> ৪৮ জন জয়েন করেছে
                  </li>
                  <li className="flex items-center gap-3">
                    <span className="bg-white/5 p-1.5 rounded-lg">⏰</span> রাত ৯:৩০ মিনিট
                  </li>
                  <li className="flex items-center gap-3">
                    <span className="bg-white/5 p-1.5 rounded-lg">🏆</span> প্রাইজপুল: ৳৫,০০০
                  </li>
                </ul>

                <button className="font-arena w-full bg-[#ff5a1f] hover:bg-[#e64f18] text-[#120e0c] py-3 font-bold tracking-wide transition-all active:scale-95">
                  যোগ দিন
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* === Membership Section === */}
      <section id="membership" className="bg-[#120e0c] py-16 md:py-20 px-4 sm:px-6 scroll-mt-20">
        <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {membership.map((card, index) => (
            <div
              key={index}
              className="bg-[#1c1512] border border-[#c9a227]/15 rounded-lg p-8 md:p-10 text-center hover:border-[#ff5a1f]/40 transition-all"
            >
              <div className="w-14 h-14 mx-auto mb-6 bg-[#c9a227]/10 border border-[#c9a227]/30 rounded-full flex items-center justify-center">
                <span className="font-arena text-[#c9a227] font-black text-xl">
                  {String(index + 1).padStart(2, '0')}
                </span>
              </div>
              <h3 className="text-xl md:text-2xl font-black text-[#f3ede6] mb-4">
                {card.title}
              </h3>
              <p className="text-[#9c8f86] leading-relaxed text-sm md:text-[15px]">
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