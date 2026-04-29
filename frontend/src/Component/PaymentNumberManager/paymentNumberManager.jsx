 import React, { useState, useEffect } from "react";

const PaymentNumberManager = () => {
  const [numbers, setNumbers] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState({ method: "bKash", number: "", limit: "", active: true });

  useEffect(() => {
    const data = JSON.parse(localStorage.getItem("payment_numbers") || "[]");
    setNumbers(data);
  }, []);

  const save = (updated) => {
    setNumbers(updated);
    localStorage.setItem("payment_numbers", JSON.stringify(updated));
  };

  const handleSubmit = () => {
    if (!form.number) {
      alert("নম্বর দিন!");
      return;
    }

    let updated;
    if (editItem !== null) {
      // Edit
      updated = numbers.map((n, i) => i === editItem ? { ...form } : n);
      setEditItem(null);
    } else {
      // Add new
      updated = [...numbers, { ...form, id: Date.now() }];
    }

    save(updated);
    setForm({ method: "bKash", number: "", limit: "", active: true });
    setShowForm(false);
  };

  const handleEdit = (idx) => {
    setEditItem(idx);
    setForm({ ...numbers[idx] });
    setShowForm(true);
  };

  const handleDelete = (idx) => {
    if (!window.confirm("এই নম্বরটি মুছবেন?")) return;
    save(numbers.filter((_, i) => i !== idx));
  };

  const toggleActive = (idx) => {
    const updated = numbers.map((n, i) =>
      i === idx ? { ...n, active: !n.active } : n
    );
    save(updated);
  };

  const methodColor = (method) => {
    if (method === "bKash")  return "bg-pink-100 text-pink-700";
    if (method === "Nagad")  return "bg-orange-100 text-orange-700";
    if (method === "Rocket") return "bg-purple-100 text-purple-700";
    return "bg-gray-100 text-gray-700";
  };

  return (
    <div className="space-y-4">

      {/* Header */}
      <div className="bg-white rounded-2xl p-4 shadow flex justify-between items-center">
        <div>
          <h3 className="font-black text-indigo-700 text-base">📱 Payment Numbers</h3>
          <p className="text-xs text-gray-400 mt-0.5">মোট: {numbers.length}টি নম্বর</p>
        </div>
        <button
          onClick={() => { setShowForm(true); setEditItem(null); setForm({ method: "bKash", number: "", limit: "", active: true }); }}
          className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-black"
        >
          + নতুন নম্বর
        </button>
      </div>

      {/* Add / Edit Form */}
      {showForm && (
        <div className="bg-white rounded-2xl p-4 shadow border-2 border-indigo-200">
          <h4 className="font-black text-sm text-indigo-700 mb-3">
            {editItem !== null ? "✏️ নম্বর Edit করুন" : "➕ নতুন নম্বর যোগ করুন"}
          </h4>

          <div className="space-y-3">
            {/* Method */}
            <div>
              <label className="text-xs font-bold text-gray-500 block mb-1">পেমেন্ট মেথড</label>
              <div className="grid grid-cols-3 gap-2">
                {["bKash", "Nagad", "Rocket"].map((m) => (
                  <button
                    key={m}
                    onClick={() => setForm({ ...form, method: m })}
                    className={`py-2 rounded-xl text-xs font-black border-2 transition ${
                      form.method === m
                        ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                        : "border-gray-200 text-gray-400"
                    }`}
                  >
                    {m === "bKash"  && "🩷 bKash"}
                    {m === "Nagad"  && "🧡 Nagad"}
                    {m === "Rocket" && "💜 Rocket"}
                  </button>
                ))}
              </div>
            </div>

            {/* Number */}
            <div>
              <label className="text-xs font-bold text-gray-500 block mb-1">নম্বর</label>
              <input
                type="text"
                placeholder="01XXXXXXXXX"
                className="w-full p-3 border border-gray-200 rounded-xl font-bold bg-gray-50 focus:outline-none focus:border-indigo-400"
                value={form.number}
                onChange={(e) => setForm({ ...form, number: e.target.value })}
              />
            </div>

            {/* Limit */}
            <div>
              <label className="text-xs font-bold text-gray-500 block mb-1">
                সর্বোচ্চ লিমিট (টাকা) — খালি রাখলে কোনো limit নেই
              </label>
              <input
                type="number"
                placeholder="যেমন: 50000"
                className="w-full p-3 border border-gray-200 rounded-xl font-bold bg-gray-50 focus:outline-none focus:border-indigo-400"
                value={form.limit}
                onChange={(e) => setForm({ ...form, limit: e.target.value })}
              />
            </div>

            {/* Active toggle */}
            <div className="flex items-center justify-between bg-gray-50 p-3 rounded-xl">
              <span className="text-sm font-bold text-gray-600">এখনই Active রাখবেন?</span>
              <button
                onClick={() => setForm({ ...form, active: !form.active })}
                className={`w-12 h-6 rounded-full transition-all ${form.active ? "bg-green-500" : "bg-gray-300"}`}
              >
                <div className={`w-5 h-5 bg-white rounded-full shadow transition-all mx-0.5 ${form.active ? "translate-x-6" : "translate-x-0"}`}></div>
              </button>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => { setShowForm(false); setEditItem(null); }}
                className="flex-1 py-2.5 rounded-xl border-2 border-gray-200 font-bold text-gray-600 text-sm"
              >
                বাতিল
              </button>
              <button
                onClick={handleSubmit}
                className="flex-1 py-2.5 rounded-xl bg-indigo-600 text-white font-bold text-sm"
              >
                {editItem !== null ? "✅ Update করুন" : "✅ যোগ করুন"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Numbers List */}
      {numbers.length === 0 && !showForm && (
        <div className="bg-white rounded-2xl p-8 text-center shadow">
          <p className="text-4xl mb-2">📭</p>
          <p className="text-gray-400 text-sm font-bold">কোনো নম্বর যোগ করা হয়নি</p>
        </div>
      )}

      {numbers.map((n, idx) => (
        <div
          key={n.id || idx}
          className={`rounded-2xl p-4 shadow border-2 ${n.active ? "border-green-200 bg-green-50" : "border-gray-200 bg-gray-50"}`}
        >
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className={`text-xs font-black px-2 py-0.5 rounded-full ${methodColor(n.method)}`}>
                  {n.method}
                </span>
                <span className={`text-xs font-black px-2 py-0.5 rounded-full ${n.active ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"}`}>
                  {n.active ? "✅ Active" : "❌ Inactive"}
                </span>
              </div>
              <p className="font-black text-lg text-gray-800">{n.number}</p>
              {n.limit && (
                <p className="text-xs text-gray-500 mt-0.5">📊 লিমিট: ৳{n.limit}</p>
              )}
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-2 ml-3">
              <button
                onClick={() => toggleActive(idx)}
                className={`px-3 py-1.5 rounded-lg text-xs font-black ${
                  n.active ? "bg-red-100 text-red-600" : "bg-green-100 text-green-600"
                }`}
              >
                {n.active ? "Deactivate" : "Activate"}
              </button>
              <button
                onClick={() => handleEdit(idx)}
                className="px-3 py-1.5 rounded-lg text-xs font-black bg-indigo-100 text-indigo-600"
              >
                ✏️ Edit
              </button>
              <button
                onClick={() => handleDelete(idx)}
                className="px-3 py-1.5 rounded-lg text-xs font-black bg-red-100 text-red-600"
              >
                🗑️ Delete
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default PaymentNumberManager;