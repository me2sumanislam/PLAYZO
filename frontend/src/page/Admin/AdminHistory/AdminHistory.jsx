 import React, { useState, useEffect, useCallback } from "react";
import api from "../../../utils/adminApi";

const STATUS_STYLE = {
  pending: { bg: "bg-amber-50", text: "text-amber-700", label: "Pending" },
  approved: { bg: "bg-green-50", text: "text-green-700", label: "Approved" },
  rejected: { bg: "bg-red-50", text: "text-red-700", label: "Rejected" },
};

const formatDate = (d) =>
  new Date(d).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

const AdminHistory = () => {
  const [type, setType] = useState("deposit"); // "deposit" | "withdraw"
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const load = useCallback(() => {
    setLoading(true);
    const url =
      type === "withdraw"
        ? "/withdraw/admin/all"
        : "/admin/deposits?limit=50";
    api(url)
      .then((d) => {
        const arr = Array.isArray(d) ? d : Array.isArray(d?.data) ? d.data : [];
        setList(arr);
      })
      .catch(() => setList([]))
      .finally(() => setLoading(false));
  }, [type]);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = list.filter((h) =>
    (h.user?.name || h.user?.phone || h.userName || "")
      .toLowerCase()
      .includes(search.toLowerCase()),
  );

  return (
    <div className="space-y-3">
      {/* Tabs */}
      <div className="bg-white rounded-2xl shadow p-1 flex gap-1">
        {[
          { id: "deposit", label: "💰 Deposit", color: "bg-green-600" },
          { id: "withdraw", label: "🏧 Withdraw", color: "bg-red-600" },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setType(t.id)}
            className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${
              type === t.id
                ? `${t.color} text-white`
                : "text-gray-500"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="bg-white rounded-2xl shadow p-3">
        <input
          placeholder="🔍 ইউজার খুঁজুন (নাম / ফোন)..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:border-indigo-400"
        />
      </div>

      {/* List */}
      <div className="bg-white rounded-2xl shadow p-3">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-black text-sm text-gray-800">
            {type === "deposit" ? "Deposit" : "Withdraw"} History
          </h3>
          <span className="text-xs text-gray-400">{filtered.length}টি</span>
        </div>

        {loading ? (
          <p className="text-center text-gray-400 text-sm py-8">⏳ লোড হচ্ছে...</p>
        ) : filtered.length === 0 ? (
          <p className="text-center text-gray-400 text-sm py-8">কোনো রেকর্ড নেই</p>
        ) : (
          <div className="space-y-2">
            {filtered.map((h) => {
              const s = STATUS_STYLE[h.status] || STATUS_STYLE.pending;
              return (
                <div
                  key={h._id}
                  className="border border-gray-100 rounded-xl p-3 flex flex-wrap items-center gap-2"
                >
                  <div className="flex-1 min-w-[110px]">
                    <p className="text-sm font-bold text-gray-800">
                      {h.user?.name || h.user?.phone || h.userName || "Unknown"}
                    </p>
                    {h.user?.name && (
                      <p className="text-xs text-gray-400">{h.user?.phone}</p>
                    )}
                  </div>

                  <div className="text-blue-900 font-black text-sm min-w-[70px]">
                    ৳{Number(h.amount || 0).toLocaleString()}
                  </div>

                  <div className="min-w-[100px]">
                    <p className="text-xs font-semibold text-gray-700">
                      {h.method || "—"}
                    </p>
                    <p className="text-[11px] text-gray-400">
                      {h.accountNo || h.trxId || "—"}
                    </p>
                  </div>

                  <p className="text-[11px] text-gray-400 min-w-[110px]">
                    {formatDate(h.createdAt)}
                  </p>

                  <span
                    className={`${s.bg} ${s.text} text-[11px] font-bold px-2.5 py-1 rounded-full`}
                  >
                    {s.label}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminHistory;