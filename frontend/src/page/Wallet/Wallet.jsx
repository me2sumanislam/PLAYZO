 import React from 'react';

const Wallet = ({ balance, deposited, winning, onBack }) => {
  return (
    <div className="bg-[#0f172a] min-h-screen text-white">

      <button onClick={onBack}>❮</button>

      <h2>Wallet</h2>

      <p>Balance: {balance}</p>
      <p>Deposited: {deposited}</p>
      <p>Winning: {winning}</p>

    </div>
  );
};

export default Wallet;