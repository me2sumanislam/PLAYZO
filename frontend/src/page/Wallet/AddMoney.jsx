import React, { useState } from 'react';

const AddMoney = ({ onBack }) => {
  const [method, setMethod] = useState(''); // bkash, nagad, rocket
  const [amount, setAmount] = useState('');
  const [trxId, setTrxId] = useState('');
  const [copied, setCopied] = useState(false);

  const adminNumbers = {
    bkash: "017XXXXXXXX",
    nagad: "019XXXXXXXX",
    rocket: "018XXXXXXXX"
  };

  const handleCopy = (num) => {
    navigator.clipboard.writeText(num);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if(!method || !amount || !trxId) return alert("সবগুলো তথ্য সঠিকভাবে দিন");
    
    // এখানে আপনি আপনার ব্যাকেন্ড বা লোকাল স্টোরেজে ডাটা পাঠাতে পারেন
    const requestData = { method, amount, trxId, status: 'pending', time: new Date().toLocaleString() };
    console.log("Payment Request Sent:", requestData);
    
    alert("আপনার রিকোয়েস্ট জমা হয়েছে! এডমিন চেক করে ব্যালেন্স এড করে দিবে।");
    onBack();
  };

  return (
    <div className="bg-[#F8FAFC] min-h-screen max-w-[450px] mx-auto font-sans pb-10">
      {/* হেডার */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-6 rounded-b-[2.5rem] shadow-lg">
        <div className="flex items-center gap-4 text-white">
          <button onClick={onBack} className="text-xl">❮</button>
          <h2 className="text-lg font-black uppercase tracking-widest">Add Money</h2>
        </div>
      </div>

      <div className="p-5 space-y-6 -mt-4">
        {/* স্টেপ ১: মেথড সিলেক্ট */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
          <p className="text-[10px] font-black text-gray-400 uppercase mb-4 tracking-widest text-center">Step 1: Select Method</p>
          <div className="grid grid-cols-3 gap-4">
            {['bkash', 'nagad', 'rocket'].map((m) => (
              <div 
                key={m}
                onClick={() => setMethod(m)}
                className={`p-3 rounded-2xl border-2 flex flex-col items-center gap-2 transition-all cursor-pointer ${method === m ? 'border-indigo-500 bg-indigo-50 scale-105' : 'border-gray-50 bg-gray-50 opacity-60'}`}
              >
                <div className="w-10 h-10 rounded-xl overflow-hidden flex items-center justify-center bg-white shadow-sm">
                   <span className="capitalize font-black text-[10px]">{m}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {method && (
          <>
            {/* স্টেপ ২: নাম্বার কপি */}
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 animate-in fade-in slide-in-from-bottom-4">
              <p className="text-[10px] font-black text-gray-400 uppercase mb-3 tracking-widest">Step 2: Send Money ({method})</p>
              <div className="bg-slate-900 p-4 rounded-2xl flex justify-between items-center border-l-4 border-yellow-400">
                <div>
                  <p className="text-[10px] text-gray-400 font-bold uppercase">Our {method} Number</p>
                  <p className="text-white font-black text-lg tracking-wider">{adminNumbers[method]}</p>
                </div>
                <button 
                  onClick={() => handleCopy(adminNumbers[method])}
                  className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${copied ? 'bg-green-500 text-white' : 'bg-yellow-400 text-slate-900'}`}
                >
                  {copied ? 'Copied!' : 'Copy'}
                </button>
              </div>
              <p className="text-[9px] text-red-500 font-bold mt-3 italic">* অবশ্যই Send Money করবেন। ক্যাশ আউট গ্রহণযোগ্য নয়।</p>
            </div>

            {/* স্টেপ ৩: ভেরিফিকেশন ফর্ম */}
            <form onSubmit={handleSubmit} className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 space-y-4 animate-in fade-in slide-in-from-bottom-8">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Step 3: Verify Payment</p>
              
              <div>
                <label className="text-[10px] font-bold text-slate-500 ml-1 uppercase">Amount (৳)</label>
                <input 
                  type="number" 
                  placeholder="কত টাকা পাঠিয়েছেন?" 
                  className="w-full p-4 bg-gray-50 border-none rounded-2xl font-bold text-sm focus:ring-2 ring-indigo-500 outline-none"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 ml-1 uppercase">Transaction ID (TrxID)</label>
                <input 
                  type="text" 
                  placeholder="TrxID এখানে দিন" 
                  className="w-full p-4 bg-gray-50 border-none rounded-2xl font-bold text-sm focus:ring-2 ring-indigo-500 outline-none uppercase"
                  value={trxId}
                  onChange={(e) => setTrxId(e.target.value)}
                  required
                />
              </div>

              <button 
                type="submit" 
                className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-black shadow-lg shadow-indigo-100 active:scale-95 transition-all uppercase tracking-widest text-xs"
              >
                Verify & Add Money
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
};

export default AddMoney;