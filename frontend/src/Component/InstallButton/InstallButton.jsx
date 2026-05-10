import { useState, useEffect } from "react";

const InstallButton = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showButton, setShowButton]         = useState(false);

  useEffect(() => {
    window.addEventListener("beforeinstallprompt", (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowButton(true);
    });
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setShowButton(false);
    }
    setDeferredPrompt(null);
  };

  if (!showButton) return null;

  return (
    <button
      onClick={handleInstall}
      style={{
        position: "fixed",
        bottom: 80,
        left: "50%",
        transform: "translateX(-50%)",
        background: "linear-gradient(135deg, #f97316, #ea580c)",
        color: "#fff",
        border: "none",
        borderRadius: 50,
        padding: "12px 28px",
        fontWeight: 800,
        fontSize: 14,
        cursor: "pointer",
        zIndex: 9999,
        boxShadow: "0 4px 20px rgba(249,115,22,0.4)",
        display: "flex",
        alignItems: "center",
        gap: 8,
        whiteSpace: "nowrap",
      }}
    >
      📱 Playzo App Install করুন
    </button>
  );
};

export default InstallButton;