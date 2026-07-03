 import React, { useState, useEffect } from "react";
import { api, timeAgo } from "../../../utils/adminApi";

const ReferralFraudAlerts = () => {
  const [data, setData]       = useState({ deviceAlerts: [], phonePatternAlerts: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    const d = await api("/admin/referral-fraud-alerts");
    if (d.success) setData(d.data);
    setLoading(false);
  };

  const box = { background: "#fff", border: "1px solid #e5e7eb", borderRadius: 14, padding: 20 };
  const badge = { background: "#fef2f2", color: "#dc2626", fontSize: 10, padding: "2px 8px", borderRadius: 20, fontWeight: 700 };

  return (
    <div style={{ padding: 24, maxWidth: 780 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
        <div style={{ fontSize: 17, fontWeight: 800 }}>⚠️ Referral Fraud Alerts</div>
        <button
          onClick={load}
          style={{ padding: "8px 14px", background: "#111827", color: "#fff", border: "none", borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer" }}
        >
          🔄 Refresh
        </button>
      </div>

      <p style={{ fontSize: 12.5, color: "#6b7280", marginBottom: 20, lineHeight: 1.6 }}>
        এই তালিকা কাউকে স্বয়ংক্রিয়ভাবে ব্লক করে না — শুধু সন্দেহজনক referral pattern গুলো তুলে ধরে,
        যাতে আপনি manually review করে deposit/gem approve বা user block করার সিদ্ধান্ত নিতে পারেন।
      </p>

      {loading ? (
        <div style={{ textAlign: "center", padding: 40, color: "#9ca3af" }}>লোড হচ্ছে...</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

          {/* Same Device/IP Referrals */}
          <div style={box}>
            <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>
              📡 একই IP/Device থেকে একাধিক Referred User ({data.deviceAlerts.length})
            </div>
            {data.deviceAlerts.length === 0 ? (
              <div style={{ fontSize: 12.5, color: "#9ca3af" }}>কোনো সন্দেহজনক pattern পাওয়া যায়নি ✅</div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {data.deviceAlerts.map((a, i) => (
                  <div key={i} style={{ border: "1px solid #fecaca", background: "#fff5f5", borderRadius: 10, padding: 12 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8 }}>
                      Referrer: {a.referrerName} ({a.referrerPhone}) <span style={badge}>SUSPICIOUS</span>
                    </div>
                    {a.suspiciousGroups.map((g, gi) => (
                      <div key={gi} style={{ fontSize: 12, color: "#7f1d1d", marginBottom: 6, paddingLeft: 8 }}>
                        <b>IP {g.ip}:</b> {g.users.map((u) => `${u.name}${u.self ? " (referrer নিজে)" : ""}`).join(", ")}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Fake Phone Pattern */}
          <div style={box}>
            <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>
              📱 সন্দেহজনক Phone Pattern ({data.phonePatternAlerts.length})
            </div>
            {data.phonePatternAlerts.length === 0 ? (
              <div style={{ fontSize: 12.5, color: "#9ca3af" }}>কোনো সন্দেহজনক নম্বর পাওয়া যায়নি ✅</div>
            ) : (
              <div style={{ border: "1px solid #f3f4f6", borderRadius: 10, overflow: "hidden" }}>
                {data.phonePatternAlerts.map((u, i) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 12px", fontSize: 12.5, borderBottom: "1px solid #f3f4f6", background: i % 2 === 0 ? "#fff" : "#fafafa" }}>
                    <div>
                      <div style={{ fontWeight: 700 }}>{u.name} — {u.phone}</div>
                      <div style={{ color: "#9ca3af", fontSize: 11 }}>
                        {u.referredBy ? `Referred by: ${u.referredBy.name} (${u.referredBy.phone})` : "সরাসরি registered"} · {timeAgo(u.createdAt)}
                      </div>
                    </div>
                    <span style={badge}>{u.suspiciousReason || "Flagged"}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      )}
    </div>
  );
};

export default ReferralFraudAlerts;