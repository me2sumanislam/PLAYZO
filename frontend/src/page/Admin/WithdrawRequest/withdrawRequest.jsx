 import React, { useState, useEffect, useCallback } from "react";
import { api } from "../../../utils/adminApi";

const WithdrawRequests = ({ adminName, refresh }) => {
  const [list, setList] = useState([]);

  const load = useCallback(() => {
    api("/withdraw/admin/all?status=pending")
      .then((d) => {
        setList(Array.isArray(d) ? d : Array.isArray(d?.data) ? d.data : []);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const approve = async (id) => {
    await api(`/withdraw/admin/approve/${id}`, {
      method: "PUT",
      body: JSON.stringify({ adminName }),
    });
    load();
    refresh?.();
  };

  const reject = async (id) => {
    await api(`/withdraw/admin/reject/${id}`, {
      method: "PUT",
      body: JSON.stringify({ adminName }),
    });
    load();
    refresh?.();
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
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 16,
          }}
        >
          <div style={{ fontSize: 14, fontWeight: 600 }}>
            Withdraw requests
          </div>

          <span
            style={{
              background: "#fee2e2",
              color: "#dc2626",
              padding: "4px 10px",
              borderRadius: "9999px",
              fontSize: "12px",
              fontWeight: 600,
            }}
          >
            {list.length} pending
          </span>
        </div>

        {list.length === 0 ? (
          <p
            style={{
              fontSize: 13,
              color: "#9ca3af",
              textAlign: "center",
              padding: 24,
            }}
          >
            No pending
          </p>
        ) : (
          list.map((r) => (
            <div
              key={r._id}
              style={{
                border: "1px solid #e5e7eb",
                borderRadius: 8,
                padding: 12,
                marginBottom: 10,
              }}
            >
              <div>User: {r.userName || r.name || "Unknown"}</div>
              <div>Amount: {r.amount}</div>

              <div style={{ marginTop: 10 }}>
                <button onClick={() => approve(r._id)}>
                  Pay ✓
                </button>

                <button
                  onClick={() => reject(r._id)}
                  style={{ marginLeft: 10 }}
                >
                  Reject
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default WithdrawRequests;