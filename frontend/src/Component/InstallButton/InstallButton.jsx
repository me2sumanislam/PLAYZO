 import { useState, useEffect, useRef } from "react";

const InstallButton = () => {
  const [show, setShow] = useState(false);
  const [installed, setInstalled] = useState(false);
  const deferredPrompt = useRef(null);

  useEffect(() => {
    // Already installed as PWA?
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setInstalled(true);
      return;
    }

    const handler = (e) => {
      e.preventDefault();
      deferredPrompt.current = e; // ✅ Save করা হলো
      setShow(true);
    };

    window.addEventListener("beforeinstallprompt", handler);

    window.addEventListener("appinstalled", () => {
      setInstalled(true);
      setShow(false);
      deferredPrompt.current = null;
    });

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt.current) return;
    deferredPrompt.current.prompt(); // ✅ Trigger করা হলো
    const { outcome } = await deferredPrompt.current.userChoice;
    if (outcome === "accepted") {
      setInstalled(true);
      setShow(false);
    }
    deferredPrompt.current = null;
  };

  if (installed || !show) return null;

  return (
    <button
      onClick={handleInstall}
      className="fixed bottom-20 left-1/2 -translate-x-1/2 z-[9999]
                 bg-orange-600 hover:bg-orange-700 active:scale-95
                 text-white font-bold text-base py-3 px-8
                 rounded-2xl shadow-2xl transition-all"
    >
      📲 uthiYO App ইনস্টল করুন
    </button>
  );
};

export default InstallButton;