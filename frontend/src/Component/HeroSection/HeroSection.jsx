 import React, { useEffect, useState } from "react";

const Hero = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isReady, setIsReady] = useState(false);

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

  return (
    <section
      id="home"
      className="bg-gradient-to-br from-[#4338ca] via-[#4f46e5] to-[#6366f1] pt-10 pb-20 px-6 overflow-hidden relative"
    >
      <style>
        {`
          @keyframes float {
            0%, 100% { transform: translateY(0px); }
            50% { transform: translateY(-10px); }
          }
          .animate-custom-float {
            animation: float 3s ease-in-out infinite;
          }

          @keyframes deckFloat {
            0%, 100% { transform: rotateX(52deg) rotateZ(-38deg) translateY(0); }
            50% { transform: rotateX(52deg) rotateZ(-38deg) translateY(-10px); }
          }
          .deck-stack {
            transform-style: preserve-3d;
            animation: deckFloat 6s ease-in-out infinite;
          }
        `}
      </style>

      <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-96 h-96 bg-white/5 rounded-full blur-3xl"></div>

      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-12 relative z-10">
        {/* Left Side Text */}
        <div className="w-full md:w-1/2 text-center md:text-left order-2 md:order-1">
          <h1 className="text-4xl md:text-6xl font-black text-white leading-[1.1]">
            বাংলাদেশের সেরা <br />
            <span className="text-[#ff8a00]">টুর্নামেন্ট</span> <br />
            অ্যাপ
          </h1>

          <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 mt-6">
            {[
              { name: "Free Fire", color: "bg-red-500", glow: "#ef4444" },
              { name: "PUBG", color: "bg-yellow-500", glow: "#eab308" },
              { name: "Ludo", color: "bg-blue-500", glow: "#3b82f6" },
            ].map((game, index) => (
              <div
                key={index}
                className="animate-custom-float"
                style={{ animationDelay: `${index * 0.4}s` }}
              >
                <span className="cursor-default bg-white/10 backdrop-blur-md border border-white/20 text-white text-xs md:text-sm px-4 py-2 rounded-full flex items-center gap-2 shadow-lg">
                  <span
                    className={`w-2.5 h-2.5 ${game.color} rounded-full animate-pulse`}
                    style={{ boxShadow: `0 0 10px ${game.glow}` }}
                  ></span>
                  <span className="font-bold tracking-wide">{game.name}</span>
                </span>
              </div>
            ))}
            <div
              className="animate-custom-float"
              style={{ animationDelay: "1.2s" }}
            >
              <span className="bg-white/5 border border-white/10 text-gray-200 text-xs md:text-sm px-4 py-2 rounded-full flex items-center gap-1.5">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4 text-[#ff8a00]"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="3"
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                <span className="italic font-medium">আরও অনেক গেম</span>
              </span>
            </div>
          </div>

          <p className="mt-8 text-indigo-50 font-medium text-base md:text-lg max-w-xl mx-auto md:mx-0 opacity-90 leading-relaxed">
            প্রতিদিন নতুন টুর্নামেন্ট, বিশাল পুরস্কার এবং অসাধারণ গেমিং
            অভিজ্ঞতা।
          </p>

          <div className="mt-10 flex flex-col sm:flex-row gap-5 justify-center md:justify-start">
            <button
              onClick={handleDownload}
              className="bg-orange-500 hover:bg-orange-600 active:bg-orange-700 
                         text-white font-bold py-4 px-12 rounded-2xl text-lg 
                         shadow-xl transition-all active:scale-95 flex items-center gap-2"
            >
              📲 এখনই uthiYO ডাউনলোড করুন
            </button>

            <button className="bg-white/10 hover:bg-white/20 border-2 border-white/20 px-10 py-4 rounded-2xl font-bold text-white backdrop-blur-sm transition-all active:scale-95">
              ভিডিও দেখুন
            </button>
          </div>

          <p className="mt-4 text-xs text-indigo-200">
            {isReady
              ? "✅ Install Prompt Ready"
              : "⏳ Waiting for install prompt..."}
          </p>
        </div>

        {/* Right Side Phone Mockup */}
        <div className="w-full md:w-1/2 flex justify-center order-1 md:order-2">
          <div className="relative group">
            <div className="absolute -inset-10 bg-orange-500/20 blur-[100px] rounded-full group-hover:bg-orange-500/30 transition-all duration-1000"></div>
            <div className="relative w-[280px] md:w-[330px] aspect-[9/18.5] bg-[#020617] rounded-[3rem] border-[10px] border-[#1e293b] shadow-2xl overflow-hidden ring-4 ring-white/5">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-[#1e293b] rounded-b-2xl z-20"></div>

              {/* Stacked screen-deck (replaces the old orange logo placeholder) */}
              <div className="h-full w-full bg-gradient-to-b from-[#0b0d1a] to-[#06070d] flex items-center justify-center p-6 relative overflow-hidden">
                <div
                  style={{ perspective: "1400px" }}
                  className="flex items-center justify-center w-full h-full"
                >
                  <div
                    className="deck-stack relative"
                    style={{ width: 170, height: 210 }}
                  >
                    {[4, 3, 2, 1, 0].map((i) => (
                      <div
                        key={i}
                        className="absolute inset-0 rounded-xl border border-white/10"
                        style={{
                          background: "linear-gradient(155deg,#1a1d33,#0e0f1f)",
                          transform: `translateZ(${-i * 22}px)`,
                          boxShadow: "0 20px 40px -10px rgba(0,0,0,0.6)",
                        }}
                      >
                        {i === 0 && (
                          <>
                            {/* ছোট অরেঞ্জ ব্যাজ */}
                            <div className="absolute top-2 left-2 w-6 h-3 rounded bg-gradient-to-r from-[#ffb020] to-[#ff7a1a]" />

                            {/* আর্ট প্যানেল */}
                            <div
                              className="absolute top-6 left-3 right-3 h-14 rounded-lg overflow-hidden"
                              style={{
                                background:
                                  "radial-gradient(circle at 30% 30%, #ffffffaa, transparent 40%), radial-gradient(circle at 70% 60%, #7b3cf7, transparent 55%), radial-gradient(circle at 20% 85%, #ff7a1a, transparent 50%), linear-gradient(160deg,#22254a,#0c0d1c)",
                              }}
                            />

                            {/* টেক্সট লেবেল */}
                            <div className="absolute bottom-3 left-3 right-3 text-left">
                              <p className="text-white text-[10px] font-bold leading-tight">
                                ফ্রি ফায়ার ওয়ার্ল্ড সিরিজ
                              </p>
                              <p className="text-[#1fd6c8] text-[7px] font-bold tracking-widest mt-0.5">
                                নেক্সট ইভেন্টস
                              </p>
                            </div>
                          </>
                        )}

                        {/* বাকি লেয়ারগুলোতে ছোট bar + tile placeholder */}
                        {i !== 0 && (
                          <div className="absolute top-3 left-3 right-3 flex flex-col gap-1.5">
                            <div className="h-1 rounded bg-white/10" />
                            <div className="h-1 rounded bg-white/10 w-2/3" />
                            <div className="flex gap-1.5 mt-1.5">
                              <div className="flex-1 aspect-square rounded-md bg-white/5 border border-white/10" />
                              <div className="flex-1 aspect-square rounded-md bg-white/5 border border-white/10" />
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;