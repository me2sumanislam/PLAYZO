 import React, { useState, useEffect } from "react";
import { api, timeAgo } from "../../../utils/adminApi";
import Badge from "../../../Component/Admin/Badge/Badge";

const ActivityLog = () => {
  const [logs, setLogs] = useState([]);
  useEffect(() => {
    api("/admin/logs")
      .then((d) => {
        setLogs(Array.isArray(d) ? d : Array.isArray(d?.data) ? d.data : []);
      })
      .catch(() => {});
  }, []);
  const colorMap = {
    approve: "green",
    reject: "red",
    create: "blue",
    ban: "amber",
    login: "gray",
  };
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
        <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>
          Admin activity log
        </div>
        {logs.map((l, i) => (
          <div
            key={i}
            style={{
              display: "flex",
              gap: 10,
              alignItems: "flex-start",
              padding: "9px 0",
              borderBottom: "1px solid #f3f4f6",
            }}
          >
            <div
              style={{
                width: 30,
                height: 30,
                borderRadius: "50%",
                background: "#f3f4f6",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 11,
                fontWeight: 700,
                flexShrink: 0,
              }}
            >
              {(l.adminName || "A").charAt(0)}
            </div>
            <div style={{ flex: 1 }}>
              <span style={{ fontSize: 13, fontWeight: 600 }}>
                {l.adminName}{" "}
              </span>
              <span style={{ fontSize: 12, color: "#6b7280" }}>
                {l.action}{" "}
              </span>
              <span style={{ fontSize: 12, fontWeight: 500 }}>{l.target}</span>
              <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 2 }}>
                {timeAgo(l.createdAt)}
              </div>
            </div>
            <Badge color={colorMap[l.type] || "gray"}>{l.type}</Badge>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ActivityLog;