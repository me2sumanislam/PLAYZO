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
    const id = setInterval(
      () => setTick((t) => (t + 1) % tickerLines.length),
      2600
    );
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

  const tickerLines = [
    "সলো ম্যাচ শুরু হচ্ছে রাত ৯:৩০ মিনিটে",
    "আজকের প্রাইজপুল ৳৫০,০০০+",
    "৪৮ জন প্লেয়ার লবিতে অপেক্ষা করছে",
  ];

  return (
    <section
      id="home"
      className="relative overflow-hidden pt-16 pb-24 px-6"
      style={{
        background: "linear-gradient(135deg, #4F6EF7 0%, #8B5CF6 50%, #A855F7 100%)",
      }}
    >
      {/* Floating icons */}
      <div className="absolute top-20 right-[28%] text-yellow-300 text-2xl opacity-80 animate-bounce">
        📢
      </div>
      <div className="absolute top-40 right-[12%] text-yellow-200 text-xl opacity-70">
        💰
      </div>
      <div className="absolute bottom-32 left-[18%] text-white/60 text-2xl">
        🎮
      </div>
      <div className="absolute bottom-20 right-[22%] text-yellow-300 text-lg opacity-80">
        ⚡
      </div>

      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-12 relative z-10">
        {/* Left Side Text */}
        <div className="w-full md:w-1/2 text-center md:text-left order-2 md:order-1">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-white leading-[1.15]">
            বাংলাদেশের সেরা
            <br />
            <span className="text-[#FF7A00]">ফ্রি ফায়ার টুর্নামেন্ট</span>
            <br />
            অ্যাপ
          </h1>

          <p className="mt-6 text-white/90 text-base md:text-lg max-w-lg mx-auto md:mx-0 leading-relaxed">
            প্রতিদিন নতুন টুর্নামেন্ট, বিশাল পুরস্কার এবং অসাধারণ গেমিং অভিজ্ঞতা।
            <br />
            বাংলাদেশের সবচেয়ে বড় ফ্রি ফায়ার কমিউনিটিতে যোগ দিন।
          </p>

          {/* Buttons */}
          <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
            <button
              onClick={handleDownload}
              className="bg-[#FF7A00] hover:bg-[#e86d00] active:bg-[#d46200]
                         text-white font-bold py-3.5 px-8 rounded-full text-lg
                         transition-all active:scale-95 flex items-center justify-center gap-2 shadow-lg shadow-orange-500/30"
            >
              ↓ এখনই ডাউনলোড করুন
            </button>

            <button className="border-2 border-white/40 text-white font-bold px-8 py-3.5 rounded-full
                               hover:bg-white/10 hover:border-white transition-all active:scale-95 flex items-center justify-center gap-2">
              ▶ ভিডিও দেখুন
            </button>
          </div>

          {/* Stats */}
          <div className="mt-12 flex flex-wrap justify-center md:justify-start gap-8 md:gap-12">
            <div className="text-center">
              <p className="text-3xl md:text-4xl font-black text-white">১০০</p>
              <p className="text-white/70 text-sm mt-1">দৈনিক টুর্নামেন্ট</p>
            </div>
            <div className="text-center">
              <p className="text-3xl md:text-4xl font-black text-white">৫০,০০০</p>
              <p className="text-white/70 text-sm mt-1">সক্রিয় খেলোয়াড়</p>
            </div>
            <div className="text-center">
              <p className="text-3xl md:text-4xl font-black text-white">১০,০০,০০০</p>
              <p className="text-white/70 text-sm mt-1">পুরস্কার বিতরণ</p>
            </div>
          </div>

          <p className="mt-6 text-xs text-white/50">
            {isReady
              ? "✅ Install Prompt Ready"
              : "⏳ Waiting for install prompt..."}
          </p>
        </div>

        {/* Right Side - Phone Mockup */}
        <div className="w-full md:w-1/2 flex justify-center order-1 md:order-2">
          <div className="relative">
            {/* Phone frame */}
            <div className="w-[260px] h-[520px] bg-black rounded-[2.5rem] border-[10px] border-gray-800 shadow-2xl overflow-hidden relative">
              {/* Notch */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-black rounded-b-2xl z-20" />

              {/* Screen content */}
              <div className="w-full h-full bg-black flex items-center justify-center">
                <div className="bg-white rounded-3xl p-6 shadow-xl">
                  {/* App Logo */}
                  <div className="w-40 h-40 mx-auto relative">
                    {/* You can replace this with your actual logo image */}
                    <div className="w-full h-full rounded-2xl bg-gradient-to-br from-red-600 via-green-600 to-red-700 flex flex-col items-center justify-center text-white relative overflow-hidden">
                      <div className="absolute inset-0 opacity-30">
                        <div className="absolute top-2 left-2 text-4xl">🐅</div>
                      </div>
                      <p className="font-black text-2xl tracking-wider z-10">KHELO</p>
                      <p className="text-xs font-bold tracking-widest z-10">BANGLADESH</p>
                      <p className="text-yellow-300 font-black text-sm mt-1 z-10">OFFICIAL</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Soft glow behind phone */}
            <div className="absolute -inset-8 bg-purple-400/30 blur-3xl rounded-full -z-10" />
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;