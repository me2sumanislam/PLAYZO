 import React, { useEffect, useState } from "react";

const Hero = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isReady, setIsReady] = useState(false);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const handler = (e) => {
      console.log("🔥 beforeinstallprompt Event FIRED!");
      e.preventDefault();
      setDeferredPrompt(e);
      setIsReady(true);
    };

    window.addEventListener("beforeinstallprompt", handler);

    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  // rotates the scoreboard ticker line every few seconds
  useEffect(() => {
    const id = setInterval(() => setTick((t) => (t + 1) % tickerLines.length), 2600);
    return () => clearInterval(id);
  }, []);

  const handleDownload = async () => {
    console.log("📌 Download Button Clicked");

    if (!deferredPrompt) {
      alert(
        "⚠️ ইনস্টল প্রম্পট এখনো রেডি হয়নি।\n\nপেজ রিফ্রেশ করে ১০-২০ সেকেন্ড অপেক্ষা করুন।"
      );
      return;
    }

    try {
      console.log("🚀 Showing Install Prompt...");
      deferredPrompt.prompt();

      const { outcome } = await deferredPrompt.userChoice;
      console.log("User Choice:", outcome);

      if (outcome === "accepted") {
        setDeferredPrompt(null);
      }
    } catch (err) {
      console.error("Install Error:", err);
      alert("কিছু সমস্যা হয়েছে। আবার চেষ্টা করুন।");
    }
  };

  const games = [
    { name: "Free Fire", code: "FF" },
    { name: "PUBG", code: "PB" },
    { name: "Ludo", code: "LD" },
  ];

  const tickerLines = [
    "সলো ম্যাচ শুরু হচ্ছে রাত ৯:৩০ মিনিটে",
    "আজকের প্রাইজপুল ৳৫০,০০০+",
    "৪৮ জন প্লেয়ার লবিতে অপেক্ষা করছে",
  ];

  return (
    <section
      id="home"
      className="relative overflow-hidden bg-[#081410] pt-12 pb-24 px-6"
    >
      <style>
        {`
          @import url('https://fonts.googleapis.com/css2?family=Rajdhani:wght@600;700&display=swap');
          .font-arena { font-family: 'Rajdhani', sans-serif; }

          @keyframes sweep {
            0% { transform: translateX(-20%) rotate(8deg); opacity: 0.15; }
            50% { transform: translateX(20%) rotate(8deg); opacity: 0.3; }
            100% { transform: translateX(-20%) rotate(8deg); opacity: 0.15; }
          }
          .floodlight {
            animation: sweep 9s ease-in-out infinite;
          }

          @keyframes cardDrift {
            0%, 100% { transform: rotate(-3deg) translateY(0); }
            50% { transform: rotate(-3deg) translateY(-12px); }
          }
          .scoreboard-card {
            animation: cardDrift 5s ease-in-out infinite;
          }

          @keyframes blink {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.35; }
          }
          .live-dot {
            animation: blink 1.4s ease-in-out infinite;
          }
        `}
      </style>

      {/* stadium floodlight beams */}
      <div className="floodlight pointer-events-none absolute -top-40 left-1/4 w-[60rem] h-[60rem] bg-[#baff29]/10 blur-[120px] rounded-full" />
      <div className="pointer-events-none absolute -bottom-32 -right-20 w-[30rem] h-[30rem] bg-[#00d9ff]/10 blur-[100px] rounded-full" />

      {/* faint grid texture, like a scoreboard grid */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage:
            "linear-gradient(#baff29 1px, transparent 1px), linear-gradient(90deg, #baff29 1px, transparent 1px)",
          backgroundSize: "56px 56px",
        }}
      />

      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-14 relative z-10">
        {/* Left Side Text */}
        <div className="w-full md:w-1/2 text-center md:text-left order-2 md:order-1">
          <span className="font-arena inline-flex items-center gap-2 text-[#baff29] text-xs md:text-sm font-bold tracking-[0.3em] uppercase border border-[#baff29]/30 px-3 py-1 rounded-sm">
            <span className="w-1.5 h-1.5 bg-[#baff29] rounded-full live-dot" />
            লাইভ টুর্নামেন্ট আরিনা
          </span>

          <h1 className="mt-5 text-4xl md:text-6xl font-black text-white leading-[1.05]">
            বাংলাদেশের সেরা
            <br />
            <span className="text-[#baff29]">টুর্নামেন্ট</span> অ্যাপ
          </h1>

          <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mt-7">
            {games.map((game, index) => (
              <span
                key={index}
                className="font-arena flex items-center gap-2 bg-white/[0.04] border-l-2 border-[#baff29] pl-3 pr-4 py-2 text-white text-sm font-bold tracking-wide"
              >
                <span className="text-[#baff29] text-[10px] font-black">
                  {game.code}
                </span>
                {game.name}
              </span>
            ))}
            <span className="text-gray-400 text-sm italic px-2">
              + আরও অনেক গেম
            </span>
          </div>

          <p className="mt-8 text-gray-300 font-medium text-base md:text-lg max-w-xl mx-auto md:mx-0 leading-relaxed">
            প্রতিদিন নতুন টুর্নামেন্ট, বিশাল পুরস্কার এবং অসাধারণ গেমিং
            অভিজ্ঞতা।
          </p>

          <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
            <button
              onClick={handleDownload}
              className="relative bg-[#baff29] hover:bg-[#a8ec1a] active:bg-[#96d915]
                         text-[#081410] font-arena font-bold py-4 px-10 text-lg
                         transition-all active:scale-95 flex items-center justify-center gap-2"
              style={{ clipPath: "polygon(0 0, 100% 0, 100% 80%, 92% 100%, 0 100%)" }}
            >
              এখনই ডাউনলোড করুন
            </button>

            <button className="border border-white/20 text-white font-arena font-bold px-8 py-4 hover:border-[#00d9ff] hover:text-[#00d9ff] transition-all active:scale-95">
              ভিডিও দেখুন
            </button>
          </div>

          <p className="mt-4 text-xs text-gray-500">
            {isReady
              ? "✅ Install Prompt Ready"
              : "⏳ Waiting for install prompt..."}
          </p>
        </div>

        {/* Right Side: floating scoreboard card (replaces phone mockup) */}
        <div className="w-full md:w-1/2 flex justify-center order-1 md:order-2">
          <div className="scoreboard-card relative w-full max-w-sm bg-[#0d1c17] border border-[#baff29]/20 rounded-lg shadow-[0_30px_80px_-20px_rgba(0,0,0,0.7)]">
            {/* header bar */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-white/10">
              <span className="font-arena text-white font-bold tracking-widest text-sm">
                MATCH BOARD
              </span>
              <span className="flex items-center gap-1.5 text-[#ff4d4d] text-[10px] font-bold tracking-widest">
                <span className="w-1.5 h-1.5 bg-[#ff4d4d] rounded-full live-dot" />
                LIVE
              </span>
            </div>

            {/* big score-style stats */}
            <div className="grid grid-cols-3 divide-x divide-white/10 py-6">
              {[
                { label: "টুর্নামেন্ট", value: "১০০+" },
                { label: "খেলোয়াড়", value: "৫০k" },
                { label: "প্রাইজ", value: "১০L" },
              ].map((s, i) => (
                <div key={i} className="text-center px-2">
                  <p className="font-arena text-[#baff29] text-2xl md:text-3xl font-black">
                    {s.value}
                  </p>
                  <p className="text-gray-400 text-[10px] tracking-widest mt-1 uppercase">
                    {s.label}
                  </p>
                </div>
              ))}
            </div>

            {/* rotating ticker line, like a stadium LED display */}
            <div className="mx-4 mb-5 bg-black/40 border border-white/10 rounded px-4 py-3 overflow-hidden">
              <p
                key={tick}
                className="font-arena text-[#00d9ff] text-xs md:text-sm font-semibold tracking-wide"
              >
                ▸ {tickerLines[tick]}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;