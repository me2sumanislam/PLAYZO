 import React, { useState, useEffect } from "react";

const API = "https://playzo-vn8e.onrender.com/api";

const AddMoneyModal = ({ isOpen, onClose }) => {
  const [form, setForm] = useState({ method: "bkash", amount: "", trxId: "" });
  const [submitted, setSubmitted] = useState(false);
  const [copied, setCopied] = useState(false);
  const [paymentNumbers, setPaymentNumbers] = useState([]);

  useEffect(() => {
    if (!isOpen) return;
    const token = localStorage.getItem("token");
fetch(`${API}/payment-numbers?activeOnly=true`, {
  headers: { Authorization: `Bearer ${token}` },
})
      .then((r) => r.json())
      .then((d) =>
        setPaymentNumbers(
          Array.isArray(d) ? d : Array.isArray(d?.data) ? d.data : []
        )
      )
      .catch(() => setPaymentNumbers([]));
  }, [isOpen]);

  if (!isOpen) return null;

  const activeNumbers = paymentNumbers.filter(
    (n) => n.method === form.method && n.active
  );
  const currentNumber = activeNumbers[0]?.number || "নম্বর এখনো যোগ করা হয়নি";
  const hasNumber = activeNumbers.length > 0;

  const handleCopy = () => {
    if (!hasNumber) return;
    navigator.clipboard.writeText(currentNumber).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleSubmit = async () => {
    if (!hasNumber) {
      alert("এই মেথডে কোনো নম্বর নেই। অন্য মেথড বেছে নিন।");
      return;
    }
    if (!form.amount || !form.trxId) {
      alert("সব তথ্য পূরণ করুন!");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const user = JSON.parse(localStorage.getItem("user") || "{}");

      const res = await fetch(`${API}/wallet/deposit`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          method: form.method,
          amount: Number(form.amount),
          trxId: form.trxId,
          paymentNumber: currentNumber,
          userId: user.id || user._id || null,
        }),
      });

      const d = await res.json();
      if (d.success) {
        setSubmitted(true);
        setForm({ method: "bkash", amount: "", trxId: "" });
      } else {
        alert(d.message || "কিছু একটা সমস্যা হয়েছে!");
      }
    } catch {
      alert("Server error! আবার চেষ্টা করুন।");
    }
  };

  const handleClose = () => {
    setSubmitted(false);
    setCopied(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/60 flex items-end justify-center">
      <div className="bg-white w-full max-w-[450px] rounded-t-3xl p-6 space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center">
          <h3 className="font-black text-lg text-indigo-700">💰 Add Money</h3>
          <button
            onClick={handleClose}
            className="w-8 h-8 bg-gray-100 rounded-full font-bold text-gray-600"
          >
            ✕
          </button>
        </div>

        {!submitted ? (
          <>
            <div>
              <label className="text-sm font-bold text-gray-600 block mb-2">
                পেমেন্ট মেথড বেছে নিন
              </label>
              <div className="grid grid-cols-3 gap-2">
                {["bkash", "nagad", "rocket"].map((method) => (
                  <button
                    key={method}
                    onClick={() => {
                      setForm({ ...form, method });
                      setCopied(false);
                    }}
                    className={`py-3 rounded-xl font-black text-sm border-2 transition ${
                      form.method === method
                        ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                        : "border-gray-200 text-gray-500"
                    }`}
                  >
                    {method === "bkash" && "🩷 bkash"}
                    {method === "nagad" && "🧡 nagad"}
                    {method === "rocket" && "💜 rocket"}
                  </button>
                ))}
              </div>
            </div>

            <div
              className={`rounded-2xl p-4 border-2 ${
                hasNumber
                  ? "bg-indigo-50 border-indigo-200"
                  : "bg-red-50 border-red-200"
              }`}
            >
              <p
                className={`text-xs font-bold mb-1 ${
                  hasNumber ? "text-indigo-500" : "text-red-400"
                }`}
              >
                {hasNumber
                  ? `এই নম্বরে টাকা পাঠান (${form.method})`
                  : "⚠️ এই মেথডে কোনো নম্বর নেই"}
              </p>
              {hasNumber && (
                <>
                  <div className="flex items-center justify-between gap-3 mt-1">
                    <p className="text-xl font-black text-indigo-800 tracking-wider">
                      {currentNumber}
                    </p>
                    <button
                      onClick={handleCopy}
                      className={`px-4 py-2 rounded-xl text-sm font-black transition ${
                        copied
                          ? "bg-green-500 text-white"
                          : "bg-indigo-600 text-white"
                      }`}
                    >
                      {copied ? "✅ Copied!" : "Copy"}
                    </button>
                  </div>
                  {activeNumbers[0]?.limit && (
                    <p className="text-[11px] text-indigo-400 mt-2">
                      📊 সর্বোচ্চ লিমিট: ৳{activeNumbers[0].limit}
                    </p>
                  )}
                  <p className="text-[11px] text-indigo-400 mt-1">
                    ⚠️ টাকা পাঠানোর পর Transaction ID সংগ্রহ করুন
                  </p>
                </>
              )}
            </div>

            <div>
              <label className="text-sm font-bold text-gray-600 block mb-1">
                পরিমাণ (টাকা)
              </label>
              <input
                type="number"
                placeholder="যেমন: 500"
                className="w-full p-3 border border-gray-200 rounded-xl font-bold bg-gray-50 focus:outline-none focus:border-indigo-400"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
              />
            </div>

            <div>
              <label className="text-sm font-bold text-gray-600 block mb-1">
                Transaction ID
              </label>
              <input
                type="text"
                placeholder="TRX ID লিখুন"
                className="w-full p-3 border border-gray-200 rounded-xl font-bold bg-gray-50 focus:outline-none focus:border-indigo-400"
                value={form.trxId}
                onChange={(e) => setForm({ ...form, trxId: e.target.value })}
              />
            </div>

            <div className="flex gap-3 pt-1">
              <button
                onClick={handleClose}
                className="flex-1 py-3 rounded-xl border-2 border-gray-200 font-bold text-gray-600"
              >
                বাতিল
              </button>
              <button
                onClick={handleSubmit}
                className="flex-1 py-3 rounded-xl bg-indigo-600 text-white font-bold shadow-lg"
              >
                ✅ Request পাঠান
              </button>
            </div>
          </>
        ) : (
          <div className="text-center py-8">
            <div className="text-6xl mb-4">✅</div>
            <p className="text-green-700 font-black text-xl">
              Request পাঠানো হয়েছে!
            </p>
            <p className="text-sm text-gray-500 mt-2">
              Admin approve করলে আপনার ব্যালেন্সে টাকা যোগ হবে।
            </p>
            <button
              onClick={handleClose}
              className="mt-6 bg-indigo-600 text-white px-10 py-3 rounded-2xl font-bold shadow"
            >
              ঠিক আছে
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AddMoneyModal;