 import React, { useState, useEffect, useCallback } from "react";

const API_BASE = "http://localhost:5000/api";

const STATUS_COLORS = {
  pending: "bg-yellow-100 text-yellow-700",
  approved: "bg-green-100 text-green-700",
  rejected: "bg-red-100 text-red-700",
};

const STATUS_LABELS = {
  pending: "পেন্ডিং",
  approved: "অ্যাপ্রুভড",
  rejected: "রিজেক্টেড",
};

const AddMoneyRequest = () => {
  const [requests, setRequests] = useState([]);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/wallet/deposits`);
      const data = await res.json();
      setRequests(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleAction = async (id, status) => {
    try {
      const res = await fetch(`${API_BASE}/wallet/deposit/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (data.success) load();
      else alert("❌ " + data.message);
    } catch (err) {
      alert("Server error!");
    }
  };

  const filtered =
    filter === "all" ? requests : requests.filter((r) => r.status === filter);

  return (
    <div className="space-y-4">
      {/* Header Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-3 text-center">
          <p className="text-yellow-600 text-xs font-bold">পেন্ডিং</p>
          <h3 className="text-2xl font-black text-yellow-700">
            {requests.filter((r) => r.status === "pending").length}
          </h3>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-2xl p-3 text-center">
          <p className="text-green-600 text-xs font-bold">অ্যাপ্রুভড</p>
          <h3 className="text-2xl font-black text-green-700">
            {requests.filter((r) => r.status === "approved").length}
          </h3>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-2xl p-3 text-center">
          <p className="text-red-600 text-xs font-bold">রিজেক্টেড</p>
          <h3 className="text-2xl font-black text-red-700">
            {requests.filter((r) => r.status === "rejected").length}
          </h3>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 bg-white rounded-2xl p-2 shadow-sm">
        {["all", "pending", "approved", "rejected"].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition ${
              filter === f
                ? "bg-indigo-600 text-white"
                : "text-gray-500 hover:bg-gray-100"
            }`}
          >
            {f === "all" ? "সব" : f === "pending" ? "পেন্ডিং" : f === "approved" ? "অ্যাপ্রুভড" : "রিজেক্টেড"}
          </button>
        ))}
      </div>

      {/* Loading */}
      {loading && (
        <div className="text-center py-8 text-gray-400 font-bold">
          লোড হচ্ছে...
        </div>
      )}

      {/* Request List */}
      {!loading && filtered.length === 0 ? (
        <div className="bg-white rounded-2xl p-8 shadow text-center">
          <p className="text-4xl mb-2">📭</p>
          <p className="text-gray-400 font-bold text-sm">কোনো রিকোয়েস্ট নেই</p>
        </div>
      ) : (
        filtered.map((req) => (
          <div
            key={req._id}
            className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100"
          >
            <div className="flex justify-between items-start mb-3">
              <div>
                <h4 className="font-black text-slate-800">
                  {req.userId?.phone || "Unknown User"}
                </h4>
              </div>
              <span className={`text-xs font-bold px-3 py-1 rounded-full ${STATUS_COLORS[req.status]}`}>
                {STATUS_LABELS[req.status]}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 mb-3">
              <div className="bg-gray-50 rounded-xl p-2 text-center">
                <p className="text-[10px] text-gray-400 font-bold">পরিমাণ</p>
                <p className="text-sm font-black text-indigo-600">৳{req.amount}</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-2 text-center">
                <p className="text-[10px] text-gray-400 font-bold">মাধ্যম</p>
                <p className="text-sm font-black">{req.method}</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-2 text-center">
                <p className="text-[10px] text-gray-400 font-bold">সময়</p>
                <p className="text-[10px] font-bold text-gray-600">
                  {new Date(req.createdAt).toLocaleString("bn-BD")}
                </p>
              </div>
            </div>

            <div className="bg-indigo-50 rounded-xl px-3 py-2 mb-3 flex justify-between items-center">
              <p className="text-[11px] text-gray-500 font-bold">TRX ID:</p>
              <p className="text-[11px] font-black text-indigo-700">{req.trxId}</p>
            </div>

            {req.status === "pending" && (
              <div className="flex gap-2">
                <button
                  onClick={() => handleAction(req._id, "approved")}
                  className="flex-1 bg-green-500 hover:bg-green-600 text-white py-2.5 rounded-xl font-bold text-sm transition active:scale-95"
                >
                  ✅ Approve
                </button>
                <button
                  onClick={() => handleAction(req._id, "rejected")}
                  className="flex-1 bg-red-500 hover:bg-red-600 text-white py-2.5 rounded-xl font-bold text-sm transition active:scale-95"
                >
                  ❌ Reject
                </button>
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
};

export default AddMoneyRequest;