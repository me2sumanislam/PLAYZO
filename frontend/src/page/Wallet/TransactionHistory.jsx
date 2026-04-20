 import React, { useState } from 'react';

const TransactionHistory = ({ onBack }) => {
  const [activeTab, setActiveTab] = useState('deposit'); // 'deposit' or 'withdraw'

  // ডামি ডাটা (পরবর্তীতে আপনি ডাটাবেস থেকে আনবেন)
  const history = {
    deposit: [
      { id: 1, method: 'Bkash', amount: 500, date: '20 Oct, 10:30 AM', status: 'Success', trxId: 'TRX782341' },
      { id: 2, method: 'Nagad', amount: 200, date: '18 Oct, 02:15 PM', status: 'Pending', trxId: 'TRX112903' },
    ],
    withdraw: [
      { id: 1, method: 'Rocket', amount: 300, date: '15 Oct, 09:00 PM', status: 'Success' },
    ]
  };

  return (
    <div className="bg-[#0f172a] min-h-screen max-w-[450px] mx-auto font-sans text-white pb-10 animate-in slide-in-from-right duration-300">
      {/* Header */}
      <div className="p-4 flex items-center gap-4 sticky top-0 bg-[#0f172a] z-50 border-b border-white/5">
        <button onClick={onBack} className="text-2xl font-bold p-2 active:scale-90 transition-all">❮</button>
        <h2 className="font-black uppercase text-lg tracking-tight">Transactions</h2>
      </div>

      {/* Tabs */}
      <div className="flex p-4 gap-2">
        <button 
          onClick={() => setActiveTab('deposit')}
          className={`flex-1 py-3 rounded-2xl font-black text-xs uppercase tracking-widest transition-all ${activeTab === 'deposit' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'bg-slate-800 text-slate-400'}`}
        >
          Deposits
        </button>
        <button 
          onClick={() => setActiveTab('withdraw')}
          className={`flex-1 py-3 rounded-2xl font-black text-xs uppercase tracking-widest transition-all ${activeTab === 'withdraw' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'bg-slate-800 text-slate-400'}`}
        >
          Withdraws
        </button>
      </div>

      {/* List Container */}
      <div className="px-4 space-y-3">
        {history[activeTab].length > 0 ? (
          history[activeTab].map((item) => (
            <div key={item.id} className="bg-slate-800/40 p-4 rounded-3xl border border-white/5 flex justify-between items-center">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl ${activeTab === 'deposit' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                  {activeTab === 'deposit' ? '↙' : '↗'}
                </div>
                <div>
                  <p className="font-black text-sm">{item.method} {activeTab === 'deposit' ? 'Deposit' : 'Withdraw'}</p>
                  <p className="text-[10px] text-slate-500 font-bold uppercase mt-0.5">{item.date}</p>
                  {item.trxId && <p className="text-[9px] text-indigo-400 font-mono mt-1">ID: {item.trxId}</p>}
                </div>
              </div>
              <div className="text-right">
                <p className={`font-black text-base ${activeTab === 'deposit' ? 'text-green-400' : 'text-red-400'}`}>
                  {activeTab === 'deposit' ? '+' : '-'} ৳{item.amount}
                </p>
                <span className={`text-[8px] font-black px-2 py-1 rounded-md uppercase tracking-tighter ${item.status === 'Success' ? 'bg-green-500/20 text-green-500' : 'bg-amber-500/20 text-amber-500'}`}>
                  {item.status}
                </span>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-20 opacity-30">
            <span className="text-5xl block mb-4">📂</span>
            <p className="font-black text-xs uppercase">No History Found</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TransactionHistory;