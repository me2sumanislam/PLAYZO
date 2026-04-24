 import React, { useState } from "react";

const Wallet = ({ onBack }) => {
  const [balance, setBalance] = useState(0);
  const [deposited, setDeposited] = useState(0);
  const [winning, setWinning] = useState(0);
  const [history, setHistory] = useState([]);

  const addMoney = () => {
    const amount = 500;
    setBalance(balance + amount);
    setDeposited(deposited + amount);
    setHistory([{ type: "Add Money", amount }, ...history]);
  };

  const withdrawMoney = () => {
    const amount = 200;
    if (balance < amount) return alert("Not enough balance");

    setBalance(balance - amount);
    setHistory([{ type: "Withdraw", amount }, ...history]);
  };

  return (
    <div className="bg-gray-100 min-h-screen max-w-[450px] mx-auto pb-20">

      <div className="bg-white p-4 flex items-center gap-3 shadow">
        <button onClick={onBack}>←</button>
        <h2 className="font-bold">Wallet</h2>
      </div>

      <div className="m-3 bg-white p-4 rounded-xl shadow">
        <h3 className="font-bold">Your Balance</h3>
        <p className="text-2xl font-black">৳ {balance}</p>
      </div>

      <div className="grid grid-cols-2 gap-3 m-3">
        <div className="bg-white p-3 rounded-xl shadow">
          <p>Deposited</p>
          <b>৳ {deposited}</b>
        </div>

        <div className="bg-white p-3 rounded-xl shadow">
          <p>Winning</p>
          <b>৳ {winning}</b>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 m-3">
        <button onClick={addMoney} className="bg-green-500 text-white p-3 rounded-xl font-bold">
          Add Money
        </button>

        <button onClick={withdrawMoney} className="bg-red-500 text-white p-3 rounded-xl font-bold">
          Withdraw
        </button>
      </div>

      <div className="m-3 bg-white p-4 rounded-xl shadow">
        <h3 className="font-bold mb-2">Transaction History</h3>

        {history.length === 0 ? (
          <p className="text-gray-400 text-sm">No transaction yet</p>
        ) : (
          history.map((h, i) => (
            <div key={i} className="flex justify-between border-b py-2 text-sm">
              <span>{h.type}</span>
              <span>৳ {h.amount}</span>
            </div>
          ))
        )}
      </div>
      <div className="m-3 bg-white p-4 rounded-xl shadow">
        <h3 className="font-bold mb-2">Learning Video add hobe</h3>

      </div>
     

    </div>
  );
};

export default Wallet;