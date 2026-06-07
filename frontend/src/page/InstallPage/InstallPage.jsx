 // page/InstallPage/InstallPage.jsx
import { useState, useEffect, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";

const InstallPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const refCode = searchParams.get("ref") || "";

  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [canInstall, setCanInstall] = useState(false);
  const [installing, setInstalling] = useState(false);
  const deferredPrompt = useRef(null);

  useEffect(() => {
    // iOS detect
    const ios = /iphone|ipad|ipod/i.test(navigator.userAgent);
    setIsIOS(ios);

    // Already installed?
    const standalone = window.matchMedia("(display-mode: standalone)").matches;
    setIsStandalone(standalone);

    // Already installed → সরাসরি app এ পাঠাও
    if (standalone) {
      navigate(`/app${refCode ? `?ref=${refCode}` : ""}`, { replace: true });
      return;
    }

    const handler = (e) => {
      e.preventDefault();
      deferredPrompt.current = e;
      setCanInstall(true);
    };

    window.addEventListener("beforeinstallprompt", handler);

    window.addEventListener("appinstalled", () => {
      // Install হয়ে গেলে app এ পাঠাও, ref code সহ
      navigate(`/app${refCode ? `?ref=${refCode}` : ""}`, { replace: true });
    });

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt.current) return;
    setInstalling(true);
    deferredPrompt.current.prompt();
    const { outcome } = await deferredPrompt.current.userChoice;
    deferredPrompt.current = null;
    setInstalling(false);
    if (outcome === "accepted") {
      // appinstalled event navigate করবে
    } else {
      // Cancel করলেও app এ যেতে দাও
      navigate(`/app${refCode ? `?ref=${refCode}` : ""}`);
    }
  };

  const handleSkip = () => {
    navigate(`/app${refCode ? `?ref=${refCode}` : ""}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1a0533] via-[#2d0a5e] to-[#0f0520] flex flex-col items-center justify-center px-6">

      {/* Logo / App Icon */}
      <div className="mb-8 flex flex-col items-center">
        <div className="w-24 h-24 rounded-3xl bg-orange-500 flex items-center justify-center shadow-2xl mb-4">
          <span className="text-4xl">🎮</span>
        </div>
        <h1 className="text-3xl font-black text-white tracking-tight">uthiYO</h1>
        <p className="text-orange-400 text-sm mt-1">Free Fire Tournament Platform</p>
      </div>

      {/* Referral info */}
      {refCode && (
        <div className="bg-white/10 border border-orange-400/30 rounded-2xl px-5 py-3 mb-8 text-center">
          <p className="text-white/70 text-sm">আপনাকে invite করা হয়েছে</p>
          <p className="text-orange-400 font-bold text-lg mt-1">🎁 বোনাস পাবেন!</p>
        </div>
      )}

      {/* Android / Desktop — Install Button */}
      {!isIOS && (
        <div className="w-full max-w-sm flex flex-col gap-3">
          {canInstall ? (
            <button
              onClick={handleInstall}
              disabled={installing}
              className="w-full bg-orange-500 hover:bg-orange-600 active:scale-95
                         text-white font-black text-lg py-4 rounded-2xl
                         shadow-lg shadow-orange-500/30 transition-all"
            >
              {installing ? "Installing..." : "📲 App ইনস্টল করুন"}
            </button>
          ) : (
            <div className="bg-white/10 rounded-2xl p-4 text-center text-white/60 text-sm">
              ⏳ Install option লোড হচ্ছে...
            </div>
          )}

          <button
            onClick={handleSkip}
            className="w-full text-white/40 text-sm py-2 hover:text-white/60 transition-colors"
          >
            Install না করে সরাসরি যান →
          </button>
        </div>
      )}

      {/* iOS — Manual Instruction */}
      {isIOS && (
        <div className="w-full max-w-sm bg-white/10 border border-white/20 rounded-2xl p-5">
          <p className="text-white font-bold text-center mb-4">
            iOS এ Install করুন
          </p>
          <div className="flex flex-col gap-3 text-white/80 text-sm">
            <div className="flex items-start gap-3">
              <span className="text-xl">1️⃣</span>
              <p>নিচের <strong>Share</strong> বাটনে চাপুন (□↑)</p>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-xl">2️⃣</span>
              <p><strong>"Add to Home Screen"</strong> সিলেক্ট করুন</p>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-xl">3️⃣</span>
              <p><strong>Add</strong> চাপুন — হয়ে গেলো!</p>
            </div>
          </div>
          <button
            onClick={handleSkip}
            className="w-full mt-5 bg-orange-500 text-white font-bold py-3 rounded-xl"
          >
            Install করা হয়ে গেছে, এগিয়ে যান →
          </button>
        </div>
      )}
    </div>
  );
};

export default InstallPage;