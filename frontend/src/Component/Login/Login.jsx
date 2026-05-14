 import React, { useState } from 'react';

const Login = ({ onLoginSuccess }) => {
  const [formData, setFormData] = useState({ phone: '', password: '' });

  const handleSubmit = (e) => {
    e.preventDefault();
    // এখানে আপনার ব্যাকেন্ড API (যেমন: axios.post('/api/login', formData)) কল করবেন
    console.log("Login details:", formData);
    // সফল লগইন হলে নিচের ফাংশনটি কল হবে
    onLoginSuccess();
  };

  return (
    <div className="w-full max-w-[450px] min-h-screen bg-white flex flex-col justify-center px-8 shadow-2xl">
      <div className="mb-10 text-center">
        <h1 className="text-4xl font-black text-slate-800 tracking-tighter">uthi<span className="text-orange-500">YO</span></h1>
        <p className="text-slate-500 mt-2 font-medium">আপনার অ্যাকাউন্টে লগইন করুন</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-sm font-bold text-slate-700 mb-2">ফোন নাম্বার</label>
          <input 
            type="text" 
            placeholder="01XXXXXXXXX"
            className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:border-orange-500 transition-all"
            onChange={(e) => setFormData({...formData, phone: e.target.value})}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-bold text-slate-700 mb-2">পাসওয়ার্ড</label>
          <input 
            type="password" 
            placeholder="******"
            className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:border-orange-500 transition-all"
            onChange={(e) => setFormData({...formData, password: e.target.value})}
            required
          />
        </div>

        <button 
          type="submit"
          className="w-full bg-slate-900 text-white p-4 rounded-2xl font-bold text-lg hover:bg-black transition-all shadow-lg active:scale-95"
        >
          লগইন করুন
        </button>
      </form>

      <p className="mt-8 text-center text-slate-600">
        অ্যাকাউন্ট নেই? <span className="text-orange-600 font-bold cursor-pointer">রেজিস্ট্রেশন করুন</span>
      </p>
    </div>
  );
};

export default Login;