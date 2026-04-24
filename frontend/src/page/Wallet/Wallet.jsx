//  import React from 'react';

// const Wallet = ({ balance, deposited, winning, onBack }) => {
//   return (
//     <div className="bg-[#0f172a] min-h-screen text-white">

//       <button onClick={onBack}>❮</button>

//       <h2>Wallet</h2>

//       <p>Balance: {balance}</p>
//       <p>Deposited: {deposited}</p>
//       <p>Winning: {winning}</p>

//     </div>
//   );
// };

// export default Wallet;

import React from "react";

const Wallet = ({ onBack }) => {
  return (
    <div className="bg-gray-100 min-h-screen max-w-[450px] mx-auto pb-20">

      {/* ================= HEADER ================= */}
      <div className="bg-white p-4 flex items-center gap-3 shadow-sm">
        <button onClick={onBack} className="text-xl">←</button>
        <h2 className="font-bold text-lg">Wallet</h2>
      </div>

      {/* ================= SECTION 1 ================= */}
      <div className="m-3 bg-white rounded-2xl p-4 shadow">

        {/* Note + Title */}
        <div className="flex items-center gap-2">
          <span className="text-2xl">🪙</span>
          <h3 className="font-bold">Your uthiyO Money</h3>
        </div>

        {/* Balance */}
        <div className="mt-4">
          <p className="text-gray-500 font-semibold">Balance</p>

          <div className="flex items-center gap-2 mt-1">
            <span className="text-xl">৳</span>
            <h1 className="text-2xl font-black">0</h1>
          </div>
        </div>
      </div>

      {/* ================= SECTION 2 ================= */}
      <div className="m-3 grid grid-cols-2 gap-3">

        {/* Deposited */}
        <div className="bg-white rounded-2xl p-4 shadow">
          <h4 className="font-bold text-gray-700">Deposited</h4>
          <div className="flex items-center gap-1 mt-2">
            <span>💰</span>
            <p className="font-black">0</p>
          </div>
        </div>

        {/* Winning */}
        <div className="bg-white rounded-2xl p-4 shadow">
          <h4 className="font-bold text-gray-700">Winning</h4>
          <div className="flex items-center gap-1 mt-2">
            <span>💰</span>
            <p className="font-black">0</p>
          </div>
        </div>

      </div>

      {/* ================= SECTION 3 ================= */}
      <div className="m-3 grid grid-cols-2 gap-3">

        {/* Add Money */}
        <div className="bg-green-500 text-white rounded-2xl p-4 text-center font-bold shadow">
          Add Money
        </div>

        {/* Withdraw */}
        <div className="bg-red-500 text-white rounded-2xl p-4 text-center font-bold shadow">
          Withdraw
        </div>

      </div>

      {/* ================= SECTION 4 ================= */}
      <div className="m-3 bg-white rounded-2xl p-4 shadow">

        <h3 className="font-bold mb-3">Transaction History</h3>

        <div className="text-gray-400 text-sm text-center py-6">
          No transactions yet
        </div>

      </div>

    </div>
  );
};

export default Wallet;