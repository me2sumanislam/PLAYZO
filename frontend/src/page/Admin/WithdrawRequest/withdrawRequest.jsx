 import React, { useState, useEffect, useCallback } from "react";
import { api } from "../../../utils/adminApi";
import Badge from "../../../Component/Admin/Badge/Badge";
import ReqRow from "../../../Component/Admin/ReqRow/ReqRow";

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
    refresh();
  };
  const reject = async (id) => {
    await api(`/withdraw/admin/reject/${id}`, {
      method: "PUT",
      body: JSON.stringify({ adminName }),
    });
    load();
    refresh();
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
          <div style={{ fontSize: 14, fontWeight: 600 }}>Withdraw requests</div>
          <Badge color="red">{list.length} pending</Badge>
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
            <ReqRow
              key={r._id}
              r={r}
              onApprove={approve}
              onReject={reject}
              actionLabel="Pay ✓"
            />
          ))
        )}
      </div>
    </div>
  );
};

export default WithdrawRequests;