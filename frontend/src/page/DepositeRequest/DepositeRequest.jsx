 import React, { useState, useEffect } from "react";

const DepositRequests = () => {
  const [requests, setRequests] = useState([]);
  const [filter, setFilter] = useState("pending");

  // Load & auto-refresh every 3 seconds
  useEffect(() => {
    const load = () => {
      const data = JSON.parse(
        localStorage.getItem("deposit_requests") || "[]"
      );
      setRequests(data);
    };
    load();
    const interval = setInterval(load, 3000);
    return () => clearInterval(interval);
  }, []);

  const updateStatus = (id, status) => {
    const updated = requests.map((r) =>
      r.id === id ? { ...r, status } : r
    );
    setRequests(updated);
    localStorage.setItem("deposit_requests", JSON.stringify(updated));

    // Approve হলে balance বাড়াও
    if (status === "approved") {
      const req = requests.find((r) => r.id === id);
      const currentBalance = parseInt(
        localStorage.getItem("user_balance") || "0"
      );
      localStorage.setItem(
        "user_balance",
        String(currentBalance + parseInt(req.amount))
      );
    }
  };

  const filtered = requests.filter((r) =>
    filter === "all" ? true : r.status === filter
  );

  const pendingCount = requests.filter((r) => r.status === "pending").length;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-white rounded-2xl p-4 shadow flex justify-between items-center">
        <div>
          <h3 className="font-black text-indigo-700 text-base">
            💰 Deposit Requests
          </h3>
          <p className="text-xs text-gray-400 mt-0.5">
            মোট: {requests.length} | Pending:{" "}
            <span className="text-orange-500 font-bold">{pendingCount}</span>
          </p>
        </div>
        {pendingCount > 0 && (
          <span className="bg-orange-500 text-white text-xs font-black px-3 py-1 rounded-full animate-pulse">
            {pendingCount} নতুন
          </span>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2">
        {[
          { id: "pending", label: "⏳ Pending" },
          { id: "approved", label: "✅ Approved" },
          { id: "rejected", label: "❌ Rejected" },
          { id: "all", label: "📋 সব" },
        ].map((f) => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition ${
              filter === f.id
                ? "bg-indigo-600 text-white"
                : "bg-white text-gray-500 border"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Empty State */}
      {filtered.length === 0 && (
        <div className="bg-white rounded-2xl p-8 text-center shadow">
          <p className="text-4xl mb-2">📭</p>
          <p className="text-gray-400 text-sm font-bold">
            কোনো request নেই
          </p>
        </div>
      )}

      {/* Request Cards */}
      {filtered
        .slice()
        .reverse()
        .map((req) => (
          <div
            key={req.id}
            className={`rounded-2xl p-4 shadow border ${
              req.status === "pending"
                ? "bg-yellow-50 border-yellow-200"
                : req.status === "approved"
                ? "bg-green-50 border-green-200"
                : "bg-red-50 border-red-200"
            }`}
          >
            {/* User Info */}
            <div className="flex justify-between items-start mb-3">
              <div>
                <p className="font-black text-sm">👤 {req.user}</p>
                <p className="text-xs text-gray-500">{req.phone}</p>
                <p className="text-[10px] text-gray-400 mt-0.5">{req.time}</p>
              </div>
              <span
                className={`text-xs font-black px-3 py-1 rounded-full ${
                  req.status === "pending"
                    ? "bg-yellow-100 text-yellow-700"
                    : req.status === "approved"
                    ? "bg-green-100 text-green-700"
                    : "bg-red-100 text-red-700"
                }`}
              >
                {req.status === "pending"
                  ? "⏳ Pending"
                  : req.status === "approved"
                  ? "✅ Approved"
                  : "❌ Rejected"}
              </span>
            </div>

            {/* Details Grid */}
            <div className="grid grid-cols-3 gap-2 mb-3">
              <div className="bg-white rounded-xl p-2 text-center">
                <p className="text-[10px] text-gray-400">পরিমাণ</p>
                <p className="font-black text-green-600 text-sm">
                  ৳{req.amount}
                </p>
              </div>
              <div className="bg-white rounded-xl p-2 text-center">
                <p className="text-[10px] text-gray-400">Method</p>
                <p className="font-bold text-xs">{req.method}</p>
              </div>
              <div className="bg-white rounded-xl p-2 text-center">
                <p className="text-[10px] text-gray-400">TRX ID</p>
                <p className="font-bold text-xs truncate">{req.trxId}</p>
              </div>
            </div>

            {/* Approve / Reject Buttons — only for pending */}
            {req.status === "pending" && (
              <div className="flex gap-2">
                <button
                  onClick={() => updateStatus(req.id, "approved")}
                  className="flex-1 bg-green-500 hover:bg-green-600 text-white py-2.5 rounded-xl text-sm font-black transition"
                >
                  ✅ Approve
                </button>
                <button
                  onClick={() => updateStatus(req.id, "rejected")}
                  className="flex-1 bg-red-500 hover:bg-red-600 text-white py-2.5 rounded-xl text-sm font-black transition"
                >
                  ❌ Reject
                </button>
              </div>
            )}
          </div>
        ))}
    </div>
  );
};

export default DepositRequests;