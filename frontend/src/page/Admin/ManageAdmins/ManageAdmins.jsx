 import React, { useState, useEffect } from "react";
import { api } from "../../../utils/adminApi";
import Badge from "../../../Component/Admin/Badge/Badge";

const ManageAdmins = () => {
  const [admins, setAdmins] = useState([]);
  const [form, setForm] = useState({
    name: "",
    phone: "",
    password: "",
    role: "admin",
  });
  const [msg, setMsg] = useState("");
  useEffect(() => {
    api("/admin/admins")
      .then((d) => {
        setAdmins(Array.isArray(d) ? d : Array.isArray(d?.data) ? d.data : []);
      })
      .catch(() => {});
  }, []);
  const create = async () => {
    const d = await api("/admin/admins/create", {
      method: "POST",
      body: JSON.stringify(form),
    });
    setMsg(d.success ? "✅ Admin created!" : "❌ " + (d.message || "Failed"));
    if (d.success) {
      setForm({ name: "", phone: "", password: "", role: "admin" });
      if (d.admin) setAdmins((p) => [...p, d.admin]);
    }
  };
  const inp = {
    width: "100%",
    padding: "9px 12px",
    border: "1px solid #e5e7eb",
    borderRadius: 8,
    fontSize: 13,
    outline: "none",
    boxSizing: "border-box",
  };
  return (
    <div
      style={{
        padding: 24,
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: 16,
      }}
    >
      <div
        style={{
          background: "#fff",
          border: "1px solid #e5e7eb",
          borderRadius: 14,
          padding: 20,
        }}
      >
        <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>
          Add new admin
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <input
            style={inp}
            placeholder="Name"
            value={form.name}
            onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
          />
          <input
            style={inp}
            placeholder="Phone"
            value={form.phone}
            onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
          />
          <input
            style={inp}
            placeholder="Password"
            type="password"
            value={form.password}
            onChange={(e) =>
              setForm((p) => ({ ...p, password: e.target.value }))
            }
          />
          <select
            style={inp}
            value={form.role}
            onChange={(e) => setForm((p) => ({ ...p, role: e.target.value }))}
          >
            <option value="admin">Admin</option>
            <option value="super-admin">Super Admin</option>
            <option value="finance">Finance</option>
          </select>
          {msg && (
            <div
              style={{
                fontSize: 12,
                padding: "7px 10px",
                borderRadius: 6,
                background: msg.startsWith("✅") ? "#d1fae5" : "#fee2e2",
                color: msg.startsWith("✅") ? "#065f46" : "#dc2626",
              }}
            >
              {msg}
            </div>
          )}
          <button
            onClick={create}
            style={{
              padding: "10px",
              background: "#111827",
              color: "#fff",
              border: "none",
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            ➕ Create Admin
          </button>
        </div>
      </div>
      <div
        style={{
          background: "#fff",
          border: "1px solid #e5e7eb",
          borderRadius: 14,
          padding: 20,
        }}
      >
        <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>
          Admins ({admins.length})
        </div>
        {admins.map((a) => (
          <div
            key={a._id}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "9px 0",
              borderBottom: "1px solid #f3f4f6",
            }}
          >
            <div
              style={{
                width: 30,
                height: 30,
                borderRadius: "50%",
                background: "#dbeafe",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 11,
                fontWeight: 700,
                color: "#1e40af",
              }}
            >
              {(a.name || a.phone || "A").charAt(0).toUpperCase()}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 600 }}>
                {a.name || a.phone}
              </div>
              <div style={{ fontSize: 11, color: "#6b7280" }}>
                {a.phone} · {a.role}
              </div>
            </div>
            <Badge
              color={
                a.role === "super-admin"
                  ? "blue"
                  : a.role === "finance"
                    ? "green"
                    : "gray"
              }
            >
              {a.role}
            </Badge>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ManageAdmins;