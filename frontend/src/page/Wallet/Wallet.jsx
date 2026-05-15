 import React, { useState } from "react";

const Wallet = ({ onBack }) => {
  const [balance, setBalance] = useState(0);
  const [deposited, setDeposited] = useState(0);
  const [winning, setWinning] = useState(0);
  const [history, setHistory] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [inputAmount, setInputAmount] = useState("");

  const quickAmounts = [100, 200, 500, 1000];

  const handleAddMoney = () => {
    const amount = parseInt(inputAmount);
    if (!amount || amount <= 0) return alert("সঠিক পরিমাণ দিন");
    setBalance((b) => b + amount);
    setDeposited((d) => d + amount);
    setHistory((h) => [
      { type: "add", label: "Add Money", amount, time: new Date().toLocaleTimeString() },
      ...h,
    ]);
    setInputAmount("");
    setShowAddModal(false);
  };

  const handleWithdraw = () => {
    const amount = parseInt(inputAmount);
    if (!amount || amount <= 0) return alert("সঠিক পরিমাণ দিন");
    if (balance < amount) return alert("পর্যাপ্ত ব্যালেন্স নেই");
    setBalance((b) => b - amount);
    setHistory((h) => [
      { type: "withdraw", label: "Withdraw", amount, time: new Date().toLocaleTimeString() },
      ...h,
    ]);
    setInputAmount("");
    setShowWithdrawModal(false);
  };

  return (
    <div className="bg-[#f5f0ff] min-h-screen max-w-[450px] mx-auto pb-20 relative">

      {/* HEADER */}
      <div className="bg-[#7c3aed] text-white p-4 flex items-center gap-3">
        <button
          onClick={onBack}
          className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center text-white text-lg"
        >
          ←
        </button>
        <h2 className="font-black text-lg tracking-wide">My Wallet</h2>
      </div>

      {/* BALANCE CARD */}
      <div className="mx-4 mt-4 bg-[#7c3aed] rounded-2xl p-5 text-white shadow-lg">
        <p className="text-sm opacity-70 mb-1">Total Balance</p>
        <p className="text-4xl font-black tracking-tight">৳ {balance.toLocaleString()}</p>

        <div className="flex gap-3 mt-4">
          <div className="flex-1 bg-white/15 rounded-xl p-3">
            <p className="text-[11px] opacity-70 uppercase tracking-wider">Deposited</p>
            <p className="text-lg font-bold mt-0.5">৳ {deposited.toLocaleString()}</p>
          </div>
          <div className="flex-1 bg-white/15 rounded-xl p-3">
            <p className="text-[11px] opacity-70 uppercase tracking-wider">Winnings</p>
            <p className="text-lg font-bold mt-0.5">৳ {winning.toLocaleString()}</p>
          </div>
        </div>
      </div>

      {/* ACTION BUTTONS */}
      <div className="grid grid-cols-2 gap-3 mx-4 mt-4">
        <button
          onClick={() => { setShowAddModal(true); setInputAmount(""); }}
          className="bg-[#7c3aed] text-white p-4 rounded-2xl font-bold flex items-center justify-center gap-2 active:scale-95 transition shadow"
        >
          <span className="text-xl">+</span> Add Money
        </button>
        <button
          onClick={() => { setShowWithdrawModal(true); setInputAmount(""); }}
          className="bg-white border-2 border-[#7c3aed] text-[#7c3aed] p-4 rounded-2xl font-bold flex items-center justify-center gap-2 active:scale-95 transition shadow"
        >
          <span className="text-xl">↑</span> Withdraw
        </button>
      </div>

      {/* TRANSACTION HISTORY */}
      <div className="mx-4 mt-5">
        <h3 className="font-black text-gray-700 mb-3 text-sm uppercase tracking-wider">
          Transaction History
        </h3>

        <div className="bg-white rounded-2xl shadow overflow-hidden">
          {history.length === 0 ? (
            <div className="p-8 text-center text-gray-400">
              <p className="text-3xl mb-2">📭</p>
              <p className="text-sm">কোনো লেনদেন নেই</p>
            </div>
          ) : (
            history.map((h, i) => (
              <div
                key={i}
                className="flex items-center justify-between px-4 py-3 border-b border-gray-50 last:border-0"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm ${
                      h.type === "add" ? "bg-green-500" : "bg-red-400"
                    }`}
                  >
                    {h.type === "add" ? "+" : "↑"}
                  </div>
                  <div>
                    <p className="font-semibold text-sm text-gray-800">{h.label}</p>
                    <p className="text-[11px] text-gray-400">{h.time}</p>
                  </div>
                </div>
                <p
                  className={`font-black text-sm ${
                    h.type === "add" ? "text-green-600" : "text-red-500"
                  }`}
                >
                  {h.type === "add" ? "+" : "-"}৳ {h.amount.toLocaleString()}
                </p>
              </div>
            ))
          )}
        </div>
      </div>

      {/* ADD MONEY MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end max-w-[450px] mx-auto">
          <div className="bg-white w-full rounded-t-3xl p-6">
            <h3 className="font-black text-lg mb-4 text-gray-800">Add Money</h3>

            <div className="grid grid-cols-4 gap-2 mb-4">
              {quickAmounts.map((a) => (
                <button
                  key={a}
                  onClick={() => setInputAmount(String(a))}
                  className={`py-2 rounded-xl text-sm font-bold border-2 transition ${
                    inputAmount === String(a)
                      ? "border-[#7c3aed] bg-[#f5f0ff] text-[#7c3aed]"
                      : "border-gray-200 text-gray-600"
                  }`}
                >
                  ৳{a}
                </button>
              ))}
            </div>

            <input
              type="number"
              placeholder="অথবা পরিমাণ লিখুন..."
              value={inputAmount}
              onChange={(e) => setInputAmount(e.target.value)}
              className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm mb-4 focus:border-[#7c3aed] outline-none"
            />

            <div className="flex gap-3">
              <button
                onClick={() => setShowAddModal(false)}
                className="flex-1 py-3 rounded-xl border-2 border-gray-200 text-gray-600 font-bold"
              >
                বাতিল
              </button>
              <button
                onClick={handleAddMoney}
                className="flex-1 py-3 rounded-xl bg-[#7c3aed] text-white font-bold"
              >
                Add ৳{inputAmount || "0"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* WITHDRAW MODAL */}
      {showWithdrawModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end max-w-[450px] mx-auto">
          <div className="bg-white w-full rounded-t-3xl p-6">
            <h3 className="font-black text-lg mb-1 text-gray-800">Withdraw</h3>
            <p className="text-sm text-gray-400 mb-4">Available: ৳ {balance.toLocaleString()}</p>

            <div className="grid grid-cols-4 gap-2 mb-4">
              {quickAmounts.map((a) => (
                <button
                  key={a}
                  onClick={() => setInputAmount(String(a))}
                  disabled={balance < a}
                  className={`py-2 rounded-xl text-sm font-bold border-2 transition ${
                    inputAmount === String(a)
                      ? "border-[#7c3aed] bg-[#f5f0ff] text-[#7c3aed]"
                      : balance < a
                      ? "border-gray-100 text-gray-300"
                      : "border-gray-200 text-gray-600"
                  }`}
                >
                  ৳{a}
                </button>
              ))}
            </div>

            <input
              type="number"
              placeholder="পরিমাণ লিখুন..."
              value={inputAmount}
              onChange={(e) => setInputAmount(e.target.value)}
              className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm mb-4 focus:border-[#7c3aed] outline-none"
            />

            <div className="flex gap-3">
              <button
                onClick={() => setShowWithdrawModal(false)}
                className="flex-1 py-3 rounded-xl border-2 border-gray-200 text-gray-600 font-bold"
              >
                বাতিল
              </button>
              <button
                onClick={handleWithdraw}
                className="flex-1 py-3 rounded-xl bg-[#7c3aed] text-white font-bold"
              >
                Withdraw ৳{inputAmount || "0"}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Wallet;