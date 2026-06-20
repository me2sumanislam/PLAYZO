 import React, { useState, useEffect } from "react";
import { api, fmt } from "../../../utils/adminApi";
 

const Users = () => {
  const [list, setList] = useState([]);
  const [search, setSearch] = useState("");
  useEffect(() => {
    api("/admin/users")
      .then((d) => {
        setList(Array.isArray(d) ? d : Array.isArray(d?.data) ? d.data : []);
      })
      .catch(() => {});
  }, []);
  const toggleBan = async (id, banned) => {
    await api(`/admin/users/${id}/${banned ? "unban" : "ban"}`, {
      method: "PUT",
    });
    setList((l) =>
      l.map((u) => (u._id === id ? { ...u, isBlocked: !banned } : u)),
    );
  };
  const filtered = list.filter(
    (u) =>
      (u.name || u.phone || "").toLowerCase().includes(search.toLowerCase()) ||
      (u.phone || "").includes(search),
  );
  return (
    <div style={{ padding: 24 }}>
      <div
        style={{
          background: "#fff",
          border: "1px solid #e5e7eb",
          borderRadius: 14,
          padding: 20,
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 14,
          }}
        >
          <div style={{ fontSize: 14, fontWeight: 600 }}>
            Users ({list.length})
          </div>
          <input
            placeholder="Search name / phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              padding: "6px 10px",
              border: "1px solid #e5e7eb",
              borderRadius: 8,
              fontSize: 12,
              outline: "none",
              width: 180,
            }}
          />
        </div>
        <table
          style={{ width: "100%", borderCollapse: "collapse", fontSize: 12.5 }}
        >
          <thead>
            <tr style={{ background: "#f9fafb" }}>
              {["Name/Phone", "Balance", "Status", "Action"].map((h) => (
                <th
                  key={h}
                  style={{
                    padding: "8px 10px",
                    textAlign: "left",
                    color: "#6b7280",
                    fontWeight: 600,
                    borderBottom: "1px solid #e5e7eb",
                  }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((u) => (
              <tr key={u._id} style={{ borderBottom: "1px solid #f3f4f6" }}>
                <td style={{ padding: "9px 10px", fontWeight: 600 }}>
                  {u.name || u.phone}
                </td>
                <td
                  style={{
                    padding: "9px 10px",
                    color: "#059669",
                    fontWeight: 600,
                  }}
                >
                  {fmt(u.balance)}
                </td>
                <td style={{ padding: "9px 10px" }}>
                  <Badge color={u.isBlocked ? "red" : "green"}>
                    {u.isBlocked ? "Banned" : "Active"}
                  </Badge>
                </td>
                <td style={{ padding: "9px 10px" }}>
                  <button
                    onClick={() => toggleBan(u._id, u.isBlocked)}
                    style={{
                      fontSize: 11,
                      padding: "3px 8px",
                      background: u.isBlocked ? "#d1fae5" : "#fee2e2",
                      color: u.isBlocked ? "#065f46" : "#991b1b",
                      border: "none",
                      borderRadius: 6,
                      cursor: "pointer",
                    }}
                  >
                    {u.isBlocked ? "Unban" : "Ban"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Users;