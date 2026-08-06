 // src/Component/Admin/HomeHighlightsManager/HomeHighlightsManager.jsx
import React, { useState, useEffect, useCallback, useRef } from "react";

const TYPE_LABEL = {
  notice: "📋 নোটিশ",
  announcement: "📢 ঘোষণা",
  top_player: "🏆 টপ প্লেয়ার",
};

const emptyForm = {
  type: "notice",
  title: "",
  body: "",
  kills: "",
  matches: "",
  badgeText: "",
  active: true,
};

const HomeHighlightsManager = ({ api }) => {
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const fileRef = useRef(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api("/home-highlights/all");
      if (res?.success) setCards(res.data || []);
    } catch {}
    setLoading(false);
  }, [api]);

  useEffect(() => {
    load();
  }, [load]);

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
    setFile(null);
    setPreview(null);
    if (fileRef.current) fileRef.current.value = "";
  };

  const handleFile = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    if (!f.type.startsWith("image/")) { setMsg("❌ শুধু image file দিন"); return; }
    if (f.size > 3 * 1024 * 1024) { setMsg("❌ 3MB এর বেশি সাইজ দেওয়া যাবে না"); return; }
    setFile(f);
    setPreview(URL.createObjectURL(f));
  };

  const startEdit = (card) => {
    setEditingId(card.id);
    setForm({
      type: card.type,
      title: card.title || "",
      body: card.body || "",
      kills: card.kills ?? "",
      matches: card.matches ?? "",
      badgeText: card.badgeText || "",
      active: card.active,
    });
    setFile(null);
    setPreview(card.imageUrl || null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const save = async () => {
    if (form.type !== "top_player" && !form.body.trim()) {
      setMsg("❌ Notice/Announcement এর জন্য body টেক্সট দিন");
      return;
    }
    if (form.type === "top_player" && !form.title.trim()) {
      setMsg("❌ Player এর নাম দিন");
      return;
    }

    setSaving(true);
    try {
      const fd = new FormData();
      fd.append("type", form.type);
      fd.append("title", form.title);
      fd.append("body", form.body);
      fd.append("kills", form.kills);
      fd.append("matches", form.matches);
      fd.append("badgeText", form.badgeText);
      fd.append("active", form.active);
      if (file) fd.append("image", file);

      const res = editingId
        ? await api(`/home-highlights/${editingId}`, { method: "PUT", body: fd })
        : await api("/home-highlights", { method: "POST", body: fd });

      if (res?.success) {
        setMsg(editingId ? "✅ আপডেট হয়েছে" : "✅ কার্ড তৈরি হয়েছে");
        resetForm();
        load();
      } else {
        setMsg("❌ " + (res?.message || "Failed"));
      }
    } catch {
      setMsg("❌ সমস্যা হয়েছে");
    }
    setSaving(false);
    setTimeout(() => setMsg(""), 3500);
  };

  const toggleActive = async (card) => {
    const fd = new FormData();
    fd.append("active", !card.active);
    await api(`/home-highlights/${card.id}`, { method: "PUT", body: fd });
    load();
  };

  const remove = async (card) => {
    if (!window.confirm(`"${card.title || card.body}" কার্ডটি মুছে ফেলতে চান?`)) return;
    const res = await api(`/home-highlights/${card.id}`, { method: "DELETE" });
    if (res?.success) load();
  };

  const move = async (index, dir) => {
    const target = index + dir;
    if (target < 0 || target >= cards.length) return;
    const next = [...cards];
    [next[index], next[target]] = [next[target], next[index]];
    setCards(next);
    const order = next.map((c, i) => ({ id: c.id, displayOrder: i }));
    await api("/home-highlights/reorder/bulk", { method: "PUT", body: JSON.stringify({ order }) });
  };

  const inp = {
    width: "100%",
    padding: "10px 12px",
    border: "1px solid #e5e7eb",
    borderRadius: 10,
    fontSize: 13,
    outline: "none",
    boxSizing: "border-box",
    background: "#f9fafb",
  };

  if (loading) return <div style={{ padding: 20 }}>লোড হচ্ছে...</div>;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16, padding: 20, maxWidth: 720 }}>
      <div style={{ background: "#fff", borderRadius: 16, padding: "14px 16px", boxShadow: "0 1px 4px #0001" }}>
        <div style={{ fontSize: 15, fontWeight: 800, color: "#4f46e5" }}>
          🏠 হোমপেজ হাইলাইট (নোটিশ / ঘোষণা / টপ প্লেয়ার)
        </div>
        <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 2 }}>
          হোমপেজের "চলমান টুর্নামেন্ট" সেকশনে এই কার্ডগুলো ক্রম অনুযায়ী দেখানো হবে।
          Active রাখলেই ইউজাররা দেখতে পাবে।
        </div>
      </div>

      {/* ── Form ── */}
      <div style={{ background: "#fff", borderRadius: 16, padding: 16, boxShadow: "0 1px 4px #0001" }}>
        <div style={{ fontSize: 13, fontWeight: 800, color: "#111827", marginBottom: 10 }}>
          {editingId ? "✏️ কার্ড এডিট করুন" : "➕ নতুন কার্ড যোগ করুন"}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <select
            style={inp}
            value={form.type}
            disabled={!!editingId}
            onChange={(e) => setForm((p) => ({ ...p, type: e.target.value }))}
          >
            <option value="notice">📋 নোটিশ</option>
            <option value="announcement">📢 ঘোষণা</option>
            <option value="top_player">🏆 টপ প্লেয়ার</option>
          </select>

          {form.type === "top_player" ? (
            <>
              <input
                style={inp}
                placeholder="প্লেয়ারের নাম / IGN"
                value={form.title}
                onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
              />
              <input
                style={inp}
                placeholder="সাব-টাইটেল (ঐচ্ছিক), যেমন: এই সপ্তাহের সেরা"
                value={form.body}
                onChange={(e) => setForm((p) => ({ ...p, body: e.target.value }))}
              />
              <div style={{ display: "flex", gap: 10 }}>
                <input
                  style={inp}
                  type="number"
                  placeholder="Kills"
                  value={form.kills}
                  onChange={(e) => setForm((p) => ({ ...p, kills: e.target.value }))}
                />
                <input
                  style={inp}
                  type="number"
                  placeholder="Matches"
                  value={form.matches}
                  onChange={(e) => setForm((p) => ({ ...p, matches: e.target.value }))}
                />
              </div>
              <input
                style={inp}
                placeholder="Badge (ঐচ্ছিক), যেমন: 🏆 TOP 1"
                value={form.badgeText}
                onChange={(e) => setForm((p) => ({ ...p, badgeText: e.target.value }))}
              />

              <div>
                <input ref={fileRef} type="file" accept="image/*" onChange={handleFile} style={{ fontSize: 12 }} />
                {preview && (
                  <img
                    src={preview}
                    alt="preview"
                    style={{ width: 90, height: 90, objectFit: "cover", borderRadius: 12, marginTop: 8, display: "block" }}
                  />
                )}
              </div>
            </>
          ) : (
            <>
              <input
                style={inp}
                placeholder="Title (ঐচ্ছিক)"
                value={form.title}
                onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
              />
              <textarea
                style={{ ...inp, minHeight: 90, resize: "vertical", fontFamily: "inherit" }}
                placeholder={form.type === "notice" ? "নোটিশের লেখা লিখুন..." : "ঘোষণার লেখা লিখুন..."}
                value={form.body}
                onChange={(e) => setForm((p) => ({ ...p, body: e.target.value }))}
              />
              <input
                style={inp}
                placeholder="Badge (ঐচ্ছিক), যেমন: 🔥 NEW"
                value={form.badgeText}
                onChange={(e) => setForm((p) => ({ ...p, badgeText: e.target.value }))}
              />
            </>
          )}

          <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#374151" }}>
            <input
              type="checkbox"
              checked={form.active}
              onChange={(e) => setForm((p) => ({ ...p, active: e.target.checked }))}
            />
            Active (হোমপেজে দেখাবে)
          </label>

          {msg && <div style={{ fontSize: 12, fontWeight: 700 }}>{msg}</div>}

          <div style={{ display: "flex", gap: 10 }}>
            <button
              onClick={save}
              disabled={saving}
              style={{
                padding: "10px 16px",
                background: "#4f46e5",
                color: "#fff",
                border: "none",
                borderRadius: 10,
                fontSize: 13,
                fontWeight: 800,
                cursor: "pointer",
              }}
            >
              {saving ? "সংরক্ষণ হচ্ছে..." : editingId ? "💾 আপডেট করুন" : "💾 তৈরি করুন"}
            </button>
            {editingId && (
              <button
                onClick={resetForm}
                style={{
                  padding: "10px 16px",
                  background: "#f3f4f6",
                  color: "#374151",
                  border: "none",
                  borderRadius: 10,
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                বাতিল
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── List ── */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {cards.length === 0 && (
          <div style={{ fontSize: 12, color: "#9ca3af", textAlign: "center", padding: 20 }}>
            এখনো কোনো কার্ড যোগ করা হয়নি
          </div>
        )}
        {cards.map((card, i) => (
          <div
            key={card.id}
            style={{
              background: "#fff",
              borderRadius: 14,
              padding: 12,
              display: "flex",
              alignItems: "center",
              gap: 12,
              boxShadow: "0 1px 4px #0001",
              opacity: card.active ? 1 : 0.5,
            }}
          >
            {card.imageUrl && (
              <img src={card.imageUrl} alt="" style={{ width: 46, height: 46, borderRadius: 10, objectFit: "cover" }} />
            )}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: "#4f46e5" }}>{TYPE_LABEL[card.type]}</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#111827", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {card.title || card.body}
              </div>
              {card.type === "top_player" && (
                <div style={{ fontSize: 11, color: "#6b7280" }}>
                  🎯 {card.kills ?? 0} kills · 🎮 {card.matches ?? 0} matches
                </div>
              )}
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              <button onClick={() => move(i, -1)} disabled={i === 0} style={btnSm}>⬆️</button>
              <button onClick={() => move(i, 1)} disabled={i === cards.length - 1} style={btnSm}>⬇️</button>
              <button onClick={() => toggleActive(card)} style={btnSm}>{card.active ? "🙈" : "👁️"}</button>
              <button onClick={() => startEdit(card)} style={btnSm}>✏️</button>
              <button onClick={() => remove(card)} style={{ ...btnSm, color: "#dc2626" }}>🗑️</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const btnSm = {
  padding: "6px 8px",
  background: "#f3f4f6",
  border: "none",
  borderRadius: 8,
  fontSize: 12,
  cursor: "pointer",
};

export default HomeHighlightsManager;