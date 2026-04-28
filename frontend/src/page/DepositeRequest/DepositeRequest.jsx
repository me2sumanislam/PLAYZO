 import React, { useEffect, useState } from "react";

const API = "http://localhost:5000";

const methodColor = {
  bkash:  { bg: "#fff0f6", badge: "#E2136E", text: "#E2136E", label: "bKash"  },
  nagad:  { bg: "#fff5f0", badge: "#F05A22", text: "#F05A22", label: "Nagad"  },
  rocket: { bg: "#fdf0fa", badge: "#8C1A6A", text: "#8C1A6A", label: "Rocket" },
};

const DepositRequests = () => {
  const [deposits, setDeposits] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [actionId, setActionId] = useState(null);

  const fetchDeposits = async () => {
    setLoading(true);
    try {
      const res  = await fetch(`${API}/api/wallet/deposits`);
      const data = await res.json();
      setDeposits(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Fetch error:", err);
      setDeposits([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDeposits();
  }, []);

  const handleAction = async (id, status) => {
    setActionId(id);
    try {
      const res  = await fetch(`${API}/api/wallet/deposit/${id}`, {
        method:  "PATCH",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ status }),
      });
      const data = await res.json();
      if (data.success) {
        setDeposits((prev) => prev.filter((d) => d._id !== id));
      } else {
        alert("Error: " + data.message);
      }
    } catch (err) {
      alert("Server error: " + err.message);
    } finally {
      setActionId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (deposits.length === 0) {
    return (
      <div className="bg-white rounded-2xl p-10 shadow text-center">
        <p className="text-4xl mb-3">📭</p>
        <p className="font-bold text-gray-500">কোনো pending request নেই</p>
        <button
          onClick={fetchDeposits}
          className="mt-4 px-5 py-2 bg-indigo-500 text-white rounded-xl text-sm font-bold"
        >
          🔄 Refresh
        </button>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-black text-lg">
          Deposit Requests
          <span className="ml-2 bg-red-100 text-red-600 text-xs px-2 py-0.5 rounded-full font-bold">
            {deposits.length} pending
          </span>
        </h3>
        <button
          onClick={fetchDeposits}
          className="text-xs text-indigo-500 font-bold px-3 py-1.5 border border-indigo-300 rounded-xl"
        >
          🔄 Refresh
        </button>
      </div>

      {/* Cards */}
      <div className="space-y-4">
        {deposits.map((d) => {
          const m         = methodColor[d.method] || methodColor.bkash;
          const isLoading = actionId === d._id;

          return (
            <div
              key={d._id}
              className="bg-white rounded-2xl shadow overflow-hidden border border-gray-100"
            >
              {/* Color strip on top */}
              <div className="h-1.5 w-full" style={{ background: m.badge }} />

              <div className="p-4">
                {/* Method + time */}
                <div className="flex justify-between items-center mb-3">
                  <span
                    className="text-xs font-black px-3 py-1 rounded-full"
                    style={{ background: m.bg, color: m.text }}
                  >
                    {m.label}
                  </span>
                  <span className="text-[10px] text-gray-400">
                    {new Date(d.createdAt).toLocaleString("bn-BD")}
                  </span>
                </div>

                {/* Info */}
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500 font-medium">Amount</span>
                    <span className="font-black text-green-600">৳ {d.amount}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500 font-medium">TrxID</span>
                    <span className="font-mono font-bold text-gray-800 bg-gray-100 px-2 py-0.5 rounded text-xs">
                      {d.trxId}
                    </span>
                  </div>
                  {d.userId && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500 font-medium">User ID</span>
                      <span className="font-mono text-xs text-gray-600">{d.userId}</span>
                    </div>
                  )}
                </div>

                {/* Buttons */}
                <div className="flex gap-2">
                  <button
                    onClick={() => handleAction(d._id, "approved")}
                    disabled={isLoading}
                    className="flex-1 py-2.5 bg-green-500 hover:bg-green-600 active:scale-95 text-white rounded-xl font-bold text-sm transition-all disabled:opacity-50"
                  >
                    {isLoading ? "..." : "✓ Approve"}
                  </button>
                  <button
                    onClick={() => handleAction(d._id, "rejected")}
                    disabled={isLoading}
                    className="flex-1 py-2.5 bg-red-500 hover:bg-red-600 active:scale-95 text-white rounded-xl font-bold text-sm transition-all disabled:opacity-50"
                  >
                    {isLoading ? "..." : "✕ Reject"}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default DepositRequests;
