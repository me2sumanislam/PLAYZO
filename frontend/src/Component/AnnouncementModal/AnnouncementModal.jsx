 // src/Component/AnnouncementModal/AnnouncementModal.jsx
import React, { useState, useEffect } from "react";
import axios from "axios";

const API_BASE = import.meta.env.VITE_API_URL || "https://playzo-vn8e.onrender.com/api";
const CLEAN_API_URL = API_BASE.endsWith("/api") ? API_BASE : `${API_BASE}/api`;

const AnnouncementModal = () => {
  const [ann, setAnn] = useState(null);
  const [visible, setVisible] = useState(false);
  const [closing, setClosing] = useState(false);

  useEffect(() => {
    let cancelled = false;
    axios
      .get(`${CLEAN_API_URL}/announcement`)
      .then((res) => {
        if (cancelled) return;
        const data = res.data?.data;
        if (!data || !data.active || !data.body) return;
        setAnn(data);
        setVisible(true);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const close = () => {
    setClosing(true);
    setTimeout(() => {
      setVisible(false);
      setClosing(false);
    }, 180);
  };

  if (!visible || !ann) return null;

  return (
    <>
      <style>{`
        @keyframes ann-fade-in { from { opacity: 0 } to { opacity: 1 } }
        @keyframes ann-fade-out { from { opacity: 1 } to { opacity: 0 } }
        @keyframes ann-pop-in {
          0%   { opacity: 0; transform: scale(0.85) translateY(18px); }
          60%  { opacity: 1; transform: scale(1.02) translateY(-2px); }
          100% { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes ann-pop-out {
          from { opacity: 1; transform: scale(1) translateY(0); }
          to   { opacity: 0; transform: scale(0.9) translateY(10px); }
        }
        @keyframes ann-glow {
          0%, 100% { box-shadow: 0 0 0 1px rgba(255,138,0,0.55), 0 0 24px 2px rgba(255,138,0,0.35), 0 20px 60px rgba(0,0,0,0.55); }
          50%      { box-shadow: 0 0 0 1px rgba(255,138,0,0.9), 0 0 40px 6px rgba(255,138,0,0.55), 0 20px 60px rgba(0,0,0,0.55); }
        }
        @keyframes ann-scan {
          0%   { transform: translateY(-100%); }
          100% { transform: translateY(220%); }
        }
        @keyframes ann-badge-pulse {
          0%, 100% { opacity: 1; }
          50%      { opacity: 0.55; }
        }
        .ann-overlay {
          position: fixed; inset: 0; z-index: 9999;
          background: radial-gradient(ellipse at center, rgba(20,10,0,0.75) 0%, rgba(4,4,10,0.92) 100%);
          backdrop-filter: blur(3px);
          display: flex; align-items: center; justify-content: center; padding: 18px;
        }
        .ann-overlay.closing { animation: ann-fade-out 0.18s ease both; }
        .ann-overlay:not(.closing) { animation: ann-fade-in 0.2s ease both; }
        .ann-card {
          position: relative;
          width: 100%; max-width: 380px;
          background: linear-gradient(180deg, #141a2e 0%, #0a0e1a 100%);
          border-radius: 18px;
          overflow: hidden;
        }
        .ann-card.closing { animation: ann-pop-out 0.18s ease both; }
        .ann-card:not(.closing) {
          animation: ann-pop-in 0.42s cubic-bezier(0.2,0.9,0.25,1) both,
                     ann-glow 2.6s ease-in-out infinite 0.42s;
        }
        .ann-scanline {
          position: absolute; left: 0; right: 0; height: 40%;
          background: linear-gradient(180deg, transparent, rgba(255,178,71,0.08), transparent);
          pointer-events: none;
          animation: ann-scan 4s linear infinite;
        }
        .ann-corner {
          position: absolute; width: 22px; height: 22px;
          border: 2px solid rgba(255,178,71,0.85);
        }
        .ann-close-btn {
          width: 32px; height: 32px; border-radius: 8px;
          background: rgba(255,255,255,0.06);
          border: 1px solid rgba(255,255,255,0.14);
          color: #9aa4c7; font-size: 16px; font-weight: 700;
          display: flex; align-items: center; justify-content: center;
          cursor: pointer; transition: all 0.15s;
        }
        .ann-close-btn:hover { background: rgba(255,255,255,0.12); color: #fff; }
        .ann-cta:active { transform: scale(0.97); }
      `}</style>

      <div className={`ann-overlay${closing ? " closing" : ""}`} onClick={close}>
        <div className={`ann-card${closing ? " closing" : ""}`} onClick={(e) => e.stopPropagation()}>
          {/* HUD corner brackets — signature element */}
          <div className="ann-corner" style={{ top: 10, left: 10, borderRight: "none", borderBottom: "none" }} />
          <div className="ann-corner" style={{ top: 10, right: 10, borderLeft: "none", borderBottom: "none" }} />
          <div className="ann-corner" style={{ bottom: 10, left: 10, borderRight: "none", borderTop: "none" }} />
          <div className="ann-corner" style={{ bottom: 10, right: 10, borderLeft: "none", borderTop: "none" }} />

          <div className="ann-scanline" />

          {/* Top bar: broadcast badge + close */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "16px 18px 0",
              position: "relative",
              zIndex: 2,
            }}
          >
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                background: "linear-gradient(90deg, #ff8a00, #ffb347)",
                color: "#1a0e00",
                fontSize: 10.5,
                fontWeight: 900,
                letterSpacing: 1.2,
                padding: "5px 16px 5px 8px",
                borderRadius: "4px 10px 10px 4px",
                textTransform: "uppercase",
                clipPath: "polygon(0 0, 100% 0, 92% 100%, 0% 100%)",
              }}
            >
              <span
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  background: "#1a0e00",
                  animation: "ann-badge-pulse 1.3s ease-in-out infinite",
                  flexShrink: 0,
                }}
              />
              Broadcast
            </div>
            <button className="ann-close-btn" onClick={close} aria-label="Close">
              ✕
            </button>
          </div>

          {/* Body */}
          <div style={{ padding: "16px 20px 20px", position: "relative", zIndex: 2 }}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 12 }}>
              <div
                style={{
                  width: 42,
                  height: 42,
                  flexShrink: 0,
                  borderRadius: 12,
                  background: "linear-gradient(135deg, #7c3aed, #4f46e5)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 20,
                  boxShadow: "0 4px 14px rgba(124,58,237,0.45)",
                }}
              >
                📢
              </div>
              {ann.title && (
                <h2
                  style={{
                    fontSize: 17,
                    fontWeight: 900,
                    color: "#f8fafc",
                    lineHeight: 1.3,
                    letterSpacing: 0.2,
                    margin: 0,
                    paddingTop: 4,
                  }}
                >
                  {ann.title}
                </h2>
              )}
            </div>

            <p
              style={{
                fontSize: 13.5,
                color: "#aab2d5",
                whiteSpace: "pre-line",
                lineHeight: 1.7,
                marginBottom: 22,
                paddingLeft: 2,
              }}
            >
              {ann.body}
            </p>

            <button
              className="ann-cta"
              onClick={close}
              style={{
                width: "100%",
                padding: "13px",
                background: "linear-gradient(90deg, #ff8a00, #ff6a00)",
                color: "#1a0e00",
                border: "none",
                borderRadius: 12,
                fontWeight: 900,
                fontSize: 13.5,
                letterSpacing: 0.6,
                textTransform: "uppercase",
                cursor: "pointer",
                boxShadow: "0 8px 20px rgba(255,106,0,0.35)",
                transition: "transform 0.1s",
              }}
            >
              বুঝেছি, চালিয়ে যাই ⚡
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default AnnouncementModal;