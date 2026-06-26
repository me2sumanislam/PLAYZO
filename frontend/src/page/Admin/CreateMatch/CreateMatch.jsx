 import React, { useState } from "react";
import { api } from "../../../utils/adminApi";

const CreateMatch = () => {
  const [form, setForm] = useState({
    title: "",
    category: "br_match",
    entryFee: "",
    winPrize: "",
    totalPlayers: "",
    startTime: "",
    perKill: "",
    map: "",
    device: "Mobile",
    image: "",
    prizes: { first: "", second: "", third: "", fourth: "" },
  });
  const [msg, setMsg] = useState("");

  const handleImage = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();
    img.onload = () => {
      const maxWidth = 400;
      const scale = Math.min(1, maxWidth / img.width);
      canvas.width = img.width * scale;
      canvas.height = img.height * scale;
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      setForm((p) => ({ ...p, image: canvas.toDataURL("image/jpeg", 0.6) }));
    };
    img.src = URL.createObjectURL(file);
  };

  // ✅ Bangladesh (UTC+6) লোকাল datetime-local string কে সঠিক UTC ISO string এ কনভার্ট করে
  // input value আসে timezone ছাড়া (যেমন "2026-06-16T20:00") — এটাকে BD লোকাল টাইম ধরে
  // ৬ ঘণ্টা বিয়োগ করে UTC বানানো হয়, যাতে সার্ভারে date পরের দিনে শিফট না হয়ে যায়।
  const bdLocalToUTC = (localStr) => {
    if (!localStr) return "";
    const [datePart, timePart] = localStr.split("T");
    const [year, month, day] = datePart.split("-").map(Number);
    const [hour, minute] = timePart.split(":").map(Number);
    // BD লোকাল টাইমকে UTC মিলিসেকেন্ডে বানানো — Date.UTC দিয়ে বানিয়ে ৬ ঘণ্টা বিয়োগ
    const utcMs = Date.UTC(year, month - 1, day, hour, minute) - 6 * 60 * 60 * 1000;
    return new Date(utcMs).toISOString();
  };

  const submit = async () => {
    if (!form.title || !form.startTime) {
      setMsg("❌ Title আর Start Time অবশ্যই দিন");
      return;
    }
    const d = await api("/matches/create", {
      method: "POST",
      body: JSON.stringify({
        ...form,
        startTime: bdLocalToUTC(form.startTime), // ✅ সঠিক UTC তে কনভার্ট করে পাঠানো
      }),
    });
    setMsg(d.success ? "✅ Match created!" : "❌ " + (d.message || "Failed"));
    if (d.success)
      setForm({
        title: "",
        category: "br_match",
        entryFee: "",
        winPrize: "",
        totalPlayers: "",
        startTime: "",
        perKill: "",
        map: "",
        device: "Mobile",
        image: "",
        prizes: { first: "", second: "", third: "", fourth: "" },
      });
  };

  const inp = {
    width: "100%",
    padding: "10px 12px",
    border: "1px solid #e5e7eb",
    borderRadius: 8,
    fontSize: 13,
    outline: "none",
    boxSizing: "border-box",
  };
  const f = (k) => ({
    style: inp,
    value: form[k],
    onChange: (e) => setForm((p) => ({ ...p, [k]: e.target.value })),
  });
  const fp = (k) => ({
    style: inp,
    value: form.prizes[k],
    onChange: (e) =>
      setForm((p) => ({ ...p, prizes: { ...p.prizes, [k]: e.target.value } })),
  });

  return (
    <div style={{ padding: 24, maxWidth: 540 }}>
      <div
        style={{
          background: "#fff",
          border: "1px solid #e5e7eb",
          borderRadius: 14,
          padding: 20,
        }}
      >
        <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 20 }}>
          🎮 New Match Create
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            <div
              style={{
                fontSize: 11,
                color: "#6b7280",
                marginBottom: 4,
                fontWeight: 600,
              }}
            >
              Match Title *
            </div>
            <input placeholder="যেমন: BR Match #1" {...f("title")} />
          </div>
          <div>
            <div
              style={{
                fontSize: 11,
                color: "#6b7280",
                marginBottom: 4,
                fontWeight: 600,
              }}
            >
              Category
            </div>
            <select
              style={inp}
              value={form.category}
              onChange={(e) =>
                setForm((p) => ({ ...p, category: e.target.value }))
              }
            >
              {[
                { key: "br_solo", label: "BR Solo (48 players)" },
                { key: "br_duo", label: "BR Duo 2vs2 (48 players)" },
                { key: "br_squad", label: "BR Squad 4vs4 (48 players)" },
                { key: "cs_solo", label: "Clash Squad Solo (2 players)" },
                { key: "cs_duo", label: "Clash Squad Duo (4 players)" },
                { key: "cs_squad", label: "Clash Squad 4vs4 (8 players)" },
                { key: "cs_6vs6", label: "Clash Squad 6vs6 (12 players)" },
                { key: "lw_solo", label: "Lone Wolf Solo (2 players)" },
                { key: "lw_duo", label: "Lone Wolf Duo (4 players)" },
                { key: "free_match", label: "Free Match (48 players)" },
              ].map((c) => (
                <option key={c.key} value={c.key}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <div
              style={{
                fontSize: 11,
                color: "#6b7280",
                marginBottom: 4,
                fontWeight: 600,
              }}
            >
              Start Time * (Bangladesh Time)
            </div>
            <input type="datetime-local" {...f("startTime")} />
          </div>
          <div>
            <div
              style={{
                fontSize: 11,
                color: "#6b7280",
                marginBottom: 6,
                fontWeight: 600,
              }}
            >
              Entry & Prize
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 10,
              }}
            >
              <input placeholder="Entry Fee (৳)" {...f("entryFee")} />
              <input placeholder="Win Prize (৳)" {...f("winPrize")} />
            </div>
          </div>
          <div
            style={{
              background: "#fefce8",
              border: "1px solid #fde68a",
              borderRadius: 10,
              padding: 14,
            }}
          >
            <div
              style={{
                fontSize: 12,
                fontWeight: 700,
                color: "#92400e",
                marginBottom: 10,
              }}
            >
              🏆 Prize Breakdown
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 10,
              }}
            >
              <div>
                <div
                  style={{ fontSize: 10, color: "#92400e", marginBottom: 3 }}
                >
                  🥇 1st Prize (৳)
                </div>
                <input
                  placeholder="60"
                  {...fp("first")}
                  style={{ ...inp, background: "#fff" }}
                />
              </div>
              <div>
                <div
                  style={{ fontSize: 10, color: "#92400e", marginBottom: 3 }}
                >
                  🥈 2nd Prize (৳)
                </div>
                <input
                  placeholder="40"
                  {...fp("second")}
                  style={{ ...inp, background: "#fff" }}
                />
              </div>
              <div>
                <div
                  style={{ fontSize: 10, color: "#92400e", marginBottom: 3 }}
                >
                  🥉 3rd Prize (৳)
                </div>
                <input
                  placeholder="20"
                  {...fp("third")}
                  style={{ ...inp, background: "#fff" }}
                />
              </div>
              <div>
                <div
                  style={{ fontSize: 10, color: "#92400e", marginBottom: 3 }}
                >
                  4️⃣ 4th Prize (৳)
                </div>
                <input
                  placeholder="10"
                  {...fp("fourth")}
                  style={{ ...inp, background: "#fff" }}
                />
              </div>
            </div>
          </div>
          <div
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}
          >
            <div>
              <div
                style={{
                  fontSize: 11,
                  color: "#6b7280",
                  marginBottom: 4,
                  fontWeight: 600,
                }}
              >
                Total Players
              </div>
              <input placeholder="48" {...f("totalPlayers")} />
            </div>
            <div>
              <div
                style={{
                  fontSize: 11,
                  color: "#6b7280",
                  marginBottom: 4,
                  fontWeight: 600,
                }}
              >
                Per Kill (৳)
              </div>
              <input placeholder="5" {...f("perKill")} />
            </div>
          </div>
          <div
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}
          >
            <div>
              <div
                style={{
                  fontSize: 11,
                  color: "#6b7280",
                  marginBottom: 4,
                  fontWeight: 600,
                }}
              >
                Map
              </div>
              <select
                style={inp}
                value={form.map}
                onChange={(e) =>
                  setForm((p) => ({ ...p, map: e.target.value }))
                }
              >
                <option value="">Select Map</option>
                <option value="Bermuda">Bermuda</option>
                <option value="Kalahari">Kalahari</option>
                <option value="Purgatory">Purgatory</option>
                <option value="Alpine">Alpine</option>
                <option value="Nexterra">Nexterra</option>
              </select>
            </div>
            <div>
              <div
                style={{
                  fontSize: 11,
                  color: "#6b7280",
                  marginBottom: 4,
                  fontWeight: 600,
                }}
              >
                Device
              </div>
              <select
                style={inp}
                value={form.device}
                onChange={(e) =>
                  setForm((p) => ({ ...p, device: e.target.value }))
                }
              >
                <option value="Mobile">Mobile</option>
                <option value="Emulator">Emulator</option>
                <option value="All">All Device</option>
              </select>
            </div>
          </div>
          <div>
            <div
              style={{
                fontSize: 11,
                color: "#6b7280",
                marginBottom: 4,
                fontWeight: 600,
              }}
            >
              Match Banner Image
            </div>
            <label
              style={{
                display: "block",
                padding: "12px",
                border: "1.5px dashed #d1d5db",
                borderRadius: 8,
                textAlign: "center",
                cursor: "pointer",
                fontSize: 13,
                color: "#6b7280",
                background: "#f9fafb",
              }}
            >
              📷 Image Upload করুন
              <input
                type="file"
                accept="image/*"
                onChange={handleImage}
                style={{ display: "none" }}
              />
            </label>
            {form.image && (
              <div style={{ marginTop: 8, position: "relative" }}>
                <img
                  src={form.image}
                  alt=""
                  style={{
                    width: "100%",
                    height: 120,
                    objectFit: "cover",
                    borderRadius: 8,
                  }}
                />
                <button
                  onClick={() => setForm((p) => ({ ...p, image: "" }))}
                  style={{
                    position: "absolute",
                    top: 6,
                    right: 6,
                    background: "#ef4444",
                    color: "#fff",
                    border: "none",
                    borderRadius: 6,
                    padding: "2px 8px",
                    fontSize: 11,
                    cursor: "pointer",
                  }}
                >
                  ✕
                </button>
              </div>
            )}
          </div>
          {msg && (
            <div
              style={{
                fontSize: 12,
                padding: "8px 10px",
                borderRadius: 6,
                background: msg.startsWith("✅") ? "#d1fae5" : "#fee2e2",
                color: msg.startsWith("✅") ? "#065f46" : "#dc2626",
              }}
            >
              {msg}
            </div>
          )}
          <button
            onClick={submit}
            style={{
              padding: "12px",
              background: "#111827",
              color: "#fff",
              border: "none",
              borderRadius: 8,
              fontSize: 14,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            🎮 Create Match
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateMatch;