 import React, { useState, useEffect } from "react";

const API = "https://playzo-vn8e.onrender.com/api/wallet";

const DepositRequests = () => {
  const [requests, setRequests] = useState([]);
  const [filter, setFilter] = useState("pending");
  const [loading, setLoading] = useState(false);

  const loadRequests = async () => {
    try {
      const res = await fetch(`${API}/deposits?status=all`); // ✅ সব আনো
      const data = await res.json();
      setRequests(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Load error:", err);
    }
  };

  useEffect(() => {
    loadRequests();
    const interval = setInterval(loadRequests, 5000);
    return () => clearInterval(interval);
  }, []);

  const updateStatus = async (id, status) => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/deposit/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      alert(data.message);
      loadRequests();
    } catch (err) {
      alert("Error: " + err.message);
    }
    setLoading(false);
  };

  // ✅ সঠিক filter
  const filtered =
    filter === "all" ? requests : requests.filter((r) => r.status === filter);

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
          { id: "pending",  label: "⏳ Pending"  },
          { id: "approved", label: "✅ Approved" },
          { id: "rejected", label: "❌ Rejected" },
          { id: "all",      label: "📋 সব"       },
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
          <p className="text-gray-400 text-sm font-bold">কোনো request নেই</p>
        </div>
      )}

      {/* Request Cards */}
      {filtered
        .slice()
        .reverse()
        .map((req) => (
          <div
            key={req._id}
            className={`rounded-2xl p-4 shadow border ${
              req.status === "pending"
                ? "bg-yellow-50 border-yellow-200"
                : req.status === "approved"
                ? "bg-green-50 border-green-200"
                : "bg-red-50 border-red-200"
            }`}
          >
            {/* Info */}
            <div className="flex justify-between items-start mb-3">
              <div>
                {/* ✅ populate করা name/phone দেখাবে */}
                <p className="font-black text-sm">
                  👤 {req.userId?.name || req.userId?.phone || "Guest"}
                </p>
                <p className="text-xs text-gray-500">
                  {req.userId?.phone || ""}
                </p>
                <p className="text-[10px] text-gray-400 mt-0.5">
                  {new Date(req.createdAt).toLocaleString("bn-BD")}
                </p>
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

            {/* Approve / Reject */}
            {req.status === "pending" && (
              <div className="flex gap-2">
                <button
                  onClick={() => updateStatus(req._id, "approved")}
                  disabled={loading}
                  className="flex-1 bg-green-500 hover:bg-green-600 text-white py-2.5 rounded-xl text-sm font-black transition disabled:opacity-50"
                >
                  ✅ Approve
                </button>
                <button
                  onClick={() => updateStatus(req._id, "rejected")}
                  disabled={loading}
                  className="flex-1 bg-red-500 hover:bg-red-600 text-white py-2.5 rounded-xl text-sm font-black transition disabled:opacity-50"
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