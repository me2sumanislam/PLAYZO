 import React, { useEffect, useState } from "react";

const SplashScreen = ({ onDone }) => {
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    const timer1 = setTimeout(() => setFadeOut(true), 2000);
    const timer2 = setTimeout(() => onDone(), 2400);
    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, []);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "#1a1a2e",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9999,
        transition: "opacity 0.4s ease",
        opacity: fadeOut ? 0 : 1,
      }}
    >
      {/* App Icon */}
      <img
        src="/logo.png"
        alt="Playzo"
        style={{
          width: 100,
          height: 100,
          borderRadius: 24,
          boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
          marginBottom: 24,
          animation: "popIn 0.5s ease",
        }}
      />

      {/* App Name */}
      <h1
        style={{
          color: "#ffffff",
          fontSize: 28,
          fontWeight: 800,
          letterSpacing: 2,
          marginBottom: 8,
        }}
      >
        PLAYZO
      </h1>

      <p style={{ color: "#aaaacc", fontSize: 13, marginBottom: 40 }}>
        Play. Win. Repeat.
      </p>

      {/* Loading dots */}
      <div style={{ display: "flex", gap: 8 }}>
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            style={{
              width: 10,
              height: 10,
              borderRadius: "50%",
              backgroundColor: "#56CCF2",
              animation: `bounce 1s ease ${i * 0.2}s infinite`,
            }}
          />
        ))}
      </div>

      <style>{`
        @keyframes bounce {
          0%, 100% { transform: translateY(0); opacity: 0.4; }
          50% { transform: translateY(-10px); opacity: 1; }
        }
        @keyframes popIn {
          0% { transform: scale(0.5); opacity: 0; }
          100% { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export default SplashScreen;