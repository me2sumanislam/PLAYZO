 import React, { useState, useEffect, useRef } from 'react';
 import axios from 'axios';
 
 const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';
 
 const METHODS = ['bKash', 'Nagad', 'Rocket'];
 
 const METHOD_COLORS = {
   bKash:  { bg: '#fce4ec', text: '#c2185b', active: '#e91e63' },
   Nagad:  { bg: '#fff3e0', text: '#e65100', active: '#ff6f00' },
   Rocket: { bg: '#ede7f6', text: '#4527a0', active: '#673ab7' },
 };
 
 const STATUS_MAP = {
   pending:  { bg: '#fff8e1', color: '#b45309', label: 'Pending'  },
   approved: { bg: '#e8f5e9', color: '#2e7d32', label: 'Approved' },
   rejected: { bg: '#ffebee', color: '#c62828', label: 'Rejected' },
 };
 
 const MIN_AMOUNT = 100;
 
 const StatusBadge = ({ status }) => {
   const s = STATUS_MAP[status] || STATUS_MAP.pending;
   return (
     <span style={{
       background: s.bg, color: s.color,
       padding: '3px 12px', borderRadius: 20,
       fontSize: 12, fontWeight: 700,
     }}>{s.label}</span>
   );
 };
 
 /**
  * FILE: Withdraw.jsx
  * ─────────────────────────────────────────
  * User-facing withdraw bottom sheet modal.
  *
  * Props:
  *   isOpen  : boolean
  *   onClose : () => void
  *
  * How to use in any page:
  *   import Withdraw from './Withdraw';
  *
  *   const [showWithdraw, setShowWithdraw] = useState(false);
  *   <button onClick={() => setShowWithdraw(true)}>Withdraw</button>
  *   <Withdraw isOpen={showWithdraw} onClose={() => setShowWithdraw(false)} />
  */
 const Withdraw = ({ isOpen, onClose }) => {
   const [amount, setAmount]           = useState('');
   const [method, setMethod]           = useState('bKash');
   const [accountNo, setAccountNo]     = useState('');
   const [loading, setLoading]         = useState(false);
   const [balance, setBalance]         = useState(0);
   const [history, setHistory]         = useState([]);
   const [error, setError]             = useState('');
   const [success, setSuccess]         = useState('');
   const [tab, setTab]                 = useState('form');
   const [dataLoading, setDataLoading] = useState(true);
   const [slideIn, setSlideIn]         = useState(false);
 
   const sheetRef = useRef(null);
   const token    = localStorage.getItem('token');
   const headers  = { Authorization: `Bearer ${token}` };
 
   /* open/close animation + body scroll lock */
   useEffect(() => {
     if (isOpen) {
       document.body.style.overflow = 'hidden';
       fetchData();
       requestAnimationFrame(() => requestAnimationFrame(() => setSlideIn(true)));
     } else {
       setSlideIn(false);
       const t = setTimeout(() => { document.body.style.overflow = ''; }, 350);
       return () => clearTimeout(t);
     }
   }, [isOpen]);
 
   /* reset form on close */
   useEffect(() => {
     if (!isOpen) {
       setAmount(''); setAccountNo('');
       setError(''); setSuccess('');
       setTab('form');
     }
   }, [isOpen]);
 
   const fetchData = async () => {
     setDataLoading(true);
     try {
       const [balRes, histRes] = await Promise.all([
         axios.get(`${API}/api/users/balance`, { headers }),
         axios.get(`${API}/api/withdraw/my`, { headers }),
       ]);
       setBalance(balRes.data.balance || 0);
       setHistory(histRes.data || []);
     } catch { /* silent */ }
     finally { setDataLoading(false); }
   };
 
   const handleClose = () => {
     setSlideIn(false);
     setTimeout(onClose, 350);
   };
 
   /* backdrop click → close */
   const handleBackdrop = (e) => {
     if (sheetRef.current && !sheetRef.current.contains(e.target)) handleClose();
   };
 
   const handleAmountChange = (e) => {
     const digits = e.target.value.replace(/\D/g, '');
     if (!digits) { setAmount(''); return; }
     setAmount(String(Math.min(parseInt(digits, 10), balance)));
   };
 
   const handleSubmit = async (e) => {
     e.preventDefault();
     setError(''); setSuccess('');
     const num = Number(amount);
     if (!num)             return setError('অনুগ্রহ করে একটি পরিমাণ লিখুন।');
     if (num < MIN_AMOUNT) return setError(`সর্বনিম্ন উত্তোলন ৳${MIN_AMOUNT}।`);
     if (num > balance)    return setError('আপনার ব্যালেন্স অপর্যাপ্ত।');
     if (!/^01[3-9]\d{8}$/.test(accountNo))
       return setError('সঠিক বাংলাদেশি মোবাইল নম্বর দিন।');
 
     setLoading(true);
     try {
       await axios.post(
         `${API}/api/withdraw/request`,
         { amount: num, method, accountNo },
         { headers }
       );
       setSuccess('অনুরোধ সফলভাবে জমা হয়েছে! ১–১২ ঘণ্টার মধ্যে প্রক্রিয়া হবে।');
       setAmount(''); setAccountNo('');
       fetchData();
       setTimeout(() => setTab('history'), 1800);
     } catch (err) {
       setError(err.response?.data?.message || 'কিছু একটা সমস্যা হয়েছে।');
     } finally {
       setLoading(false);
     }
   };
 
   const formatDate = (d) =>
     new Date(d).toLocaleString('en-GB', {
       day: '2-digit', month: 'short', year: 'numeric',
       hour: '2-digit', minute: '2-digit',
     });
 
   const QUICK = [100, 500, 1000, 2000].filter(v => v <= balance);
 
   if (!isOpen) return null;
 
   return (
     <>
       <style>{`@keyframes wdFadeIn{from{opacity:0}to{opacity:1}}`}</style>
 
       {/* Backdrop */}
       <div
         onClick={handleBackdrop}
         style={{
           position: 'fixed', inset: 0, zIndex: 9999,
           background: 'rgba(0,0,0,0.55)',
           animation: 'wdFadeIn 0.25s ease forwards',
           display: 'flex', alignItems: 'flex-end',
         }}
       >
         {/* Bottom Sheet */}
         <div
           ref={sheetRef}
           style={{
             width: '100%', maxWidth: 480, margin: '0 auto',
             background: '#f5f6fa',
             borderRadius: '20px 20px 0 0',
             maxHeight: '92dvh', overflowY: 'auto',
             fontFamily: "'Hind Siliguri','Segoe UI',sans-serif",
             paddingBottom: 40,
             transform: slideIn ? 'translateY(0)' : 'translateY(100%)',
             transition: 'transform 0.35s cubic-bezier(0.32,0.72,0,1)',
             WebkitOverflowScrolling: 'touch',
           }}
         >
           {/* drag handle */}
           <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 12, paddingBottom: 4 }}>
             <div style={{ width: 40, height: 4, borderRadius: 2, background: 'rgba(0,0,0,0.15)' }} />
           </div>
 
           {/* Header */}
           <div style={{
             background: 'linear-gradient(135deg,#1e3a8a 0%,#3b82f6 100%)',
             padding: '14px 20px 32px', color: '#fff',
           }}>
             <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
               <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>টাকা উত্তোলন</h1>
 
               {/* ✕ Close */}
               <button
                 onClick={handleClose}
                 aria-label="বন্ধ করুন"
                 style={{
                   background: 'rgba(255,255,255,0.2)', border: 'none',
                   borderRadius: '50%', width: 36, height: 36,
                   cursor: 'pointer', display: 'flex',
                   alignItems: 'center', justifyContent: 'center',
                   color: '#fff', flexShrink: 0,
                   WebkitTapHighlightColor: 'transparent',
                 }}
               >
                 <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                   stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                   <line x1="18" y1="6" x2="6" y2="18" />
                   <line x1="6" y1="6" x2="18" y2="18" />
                 </svg>
               </button>
             </div>
 
             {/* Balance card */}
             <div style={{
               background: 'rgba(255,255,255,0.15)', borderRadius: 16,
               padding: '18px 24px', backdropFilter: 'blur(8px)',
               border: '1px solid rgba(255,255,255,0.25)', textAlign: 'center',
             }}>
               <p style={{ margin: '0 0 4px', fontSize: 13, opacity: 0.8, textTransform: 'uppercase', letterSpacing: 1 }}>
                 উপলব্ধ ব্যালেন্স
               </p>
               <h2 style={{ margin: 0, fontSize: 34, fontWeight: 800, letterSpacing: -1 }}>
                 {dataLoading ? '...' : `৳ ${balance.toLocaleString()}`}
               </h2>
               <p style={{ margin: '6px 0 0', fontSize: 12, opacity: 0.7 }}>
                 সর্বনিম্ন উত্তোলন: ৳{MIN_AMOUNT}
               </p>
             </div>
           </div>
 
           {/* Tabs */}
           <div style={{
             display: 'flex', margin: '-16px 16px 0',
             background: '#fff', borderRadius: 12, padding: 4,
             boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
           }}>
             {[['form', 'নতুন অনুরোধ'], ['history', 'ইতিহাস']].map(([key, label]) => (
               <button key={key} onClick={() => setTab(key)} style={{
                 flex: 1, padding: '10px', border: 'none', borderRadius: 9,
                 cursor: 'pointer', fontWeight: 600, fontSize: 14, transition: 'all 0.2s',
                 background: tab === key ? '#1e3a8a' : 'transparent',
                 color: tab === key ? '#fff' : '#6b7280',
                 fontFamily: 'inherit', WebkitTapHighlightColor: 'transparent',
               }}>{label}</button>
             ))}
           </div>
 
           <div style={{ padding: '24px 16px 0' }}>
 
             {/* ══ FORM TAB ══ */}
             {tab === 'form' && (
               <form onSubmit={handleSubmit} autoComplete="off">
 
                 {/* Method */}
                 <div style={{ marginBottom: 20 }}>
                   <p style={{ margin: '0 0 10px', fontWeight: 600, fontSize: 14, color: '#374151' }}>পেমেন্ট পদ্ধতি</p>
                   <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10 }}>
                     {METHODS.map(m => {
                       const c = METHOD_COLORS[m];
                       const active = method === m;
                       return (
                         <button key={m} type="button" onClick={() => setMethod(m)} style={{
                           padding: '14px 8px', borderRadius: 12, cursor: 'pointer',
                           border: `2px solid ${active ? c.active : '#e5e7eb'}`,
                           background: active ? c.bg : '#fff',
                           color: active ? c.text : '#9ca3af',
                           fontWeight: 700, fontSize: 14, transition: 'all 0.2s',
                           transform: active ? 'scale(1.03)' : 'scale(1)',
                           fontFamily: 'inherit', WebkitTapHighlightColor: 'transparent',
                         }}>{m}</button>
                       );
                     })}
                   </div>
                 </div>
 
                 {/* Amount */}
                 <div style={{ marginBottom: 12 }}>
                   <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                     <label style={{ fontWeight: 600, fontSize: 14, color: '#374151' }}>উত্তোলনের পরিমাণ</label>
                     {balance >= MIN_AMOUNT && (
                       <button type="button" onClick={() => setAmount(String(balance))} style={{
                         background: '#1e3a8a', color: '#fff', border: 'none',
                         borderRadius: 6, padding: '3px 10px', fontSize: 12,
                         fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
                         WebkitTapHighlightColor: 'transparent',
                       }}>সর্বোচ্চ</button>
                     )}
                   </div>
                   <div style={{ position: 'relative' }}>
                     <span style={{
                       position: 'absolute', left: 14, top: '50%',
                       transform: 'translateY(-50%)', fontWeight: 700, color: '#6b7280', fontSize: 16,
                     }}>৳</span>
                     <input
                       type="text" inputMode="numeric"
                       value={amount} onChange={handleAmountChange}
                       placeholder="পরিমাণ লিখুন" required
                       style={{
                         width: '100%', boxSizing: 'border-box',
                         padding: '14px 16px 14px 36px',
                         border: '1.5px solid #e5e7eb', borderRadius: 12,
                         fontSize: 16, background: '#f9fafb',
                         outline: 'none', fontFamily: 'inherit',
                       }}
                     />
                   </div>
                   <p style={{ margin: '6px 0 0', fontSize: 12, color: '#9ca3af' }}>
                     সর্বনিম্ন: ৳{MIN_AMOUNT} · সর্বোচ্চ: ৳{balance.toLocaleString()}
                   </p>
                 </div>
 
                 {/* Quick amounts */}
                 {QUICK.length > 0 && (
                   <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
                     {QUICK.map(v => (
                       <button key={v} type="button" onClick={() => setAmount(String(v))} style={{
                         flex: 1, padding: '8px 4px', border: '1px solid #e5e7eb', borderRadius: 8,
                         background: amount === String(v) ? '#1e3a8a' : '#f3f4f6',
                         color: amount === String(v) ? '#fff' : '#6b7280',
                         fontSize: 13, fontWeight: 600, cursor: 'pointer',
                         transition: 'all 0.15s', fontFamily: 'inherit',
                         WebkitTapHighlightColor: 'transparent',
                       }}>৳{v >= 1000 ? `${v / 1000}k` : v}</button>
                     ))}
                   </div>
                 )}
 
                 {/* Account */}
                 <div style={{ marginBottom: 24 }}>
                   <label style={{ display: 'block', marginBottom: 6, fontWeight: 600, fontSize: 14, color: '#374151' }}>
                     {method} অ্যাকাউন্ট নম্বর
                   </label>
                   <input
                     type="tel" inputMode="numeric"
                     value={accountNo}
                     onChange={e => setAccountNo(e.target.value.replace(/\D/g, '').slice(0, 11))}
                     placeholder="01XXXXXXXXX" required maxLength={11}
                     style={{
                       width: '100%', boxSizing: 'border-box',
                       padding: '14px 16px', border: '1.5px solid #e5e7eb',
                       borderRadius: 12, fontSize: 16, background: '#f9fafb',
                       outline: 'none', fontFamily: 'inherit',
                     }}
                   />
                   <p style={{ margin: '6px 0 0', fontSize: 12, color: '#9ca3af' }}>
                     {method} রেজিস্টার্ড নম্বর দিন
                   </p>
                 </div>
 
                 {error   && <div style={{ background: '#ffebee', border: '1px solid #ef9a9a', borderRadius: 10, padding: '12px 16px', marginBottom: 16, color: '#b71c1c', fontSize: 14 }}>{error}</div>}
                 {success && <div style={{ background: '#e8f5e9', border: '1px solid #a5d6a7', borderRadius: 10, padding: '12px 16px', marginBottom: 16, color: '#1b5e20', fontSize: 14 }}>{success}</div>}
 
                 <button type="submit" disabled={loading || balance < MIN_AMOUNT} style={{
                   width: '100%', padding: '16px', borderRadius: 14, border: 'none',
                   background: (loading || balance < MIN_AMOUNT) ? '#93c5fd' : 'linear-gradient(135deg,#1e3a8a,#3b82f6)',
                   color: '#fff', fontWeight: 700, fontSize: 16,
                   cursor: (loading || balance < MIN_AMOUNT) ? 'not-allowed' : 'pointer',
                   boxShadow: '0 4px 15px rgba(59,130,246,0.35)', fontFamily: 'inherit',
                 }}>
                   {loading ? 'জমা দেওয়া হচ্ছে...' : 'উত্তোলনের অনুরোধ জমা দিন'}
                 </button>
 
                 {balance < MIN_AMOUNT && !dataLoading && (
                   <div style={{ marginTop: 12, padding: '12px 16px', background: '#fff5f5', borderRadius: 10, border: '1px solid #fecaca', fontSize: 13, color: '#b91c1c', textAlign: 'center' }}>
                     ব্যালেন্স অপর্যাপ্ত। সর্বনিম্ন ৳{MIN_AMOUNT} প্রয়োজন।
                   </div>
                 )}
 
                 <div style={{ marginTop: 16, padding: '14px 16px', background: '#fffbeb', borderRadius: 12, border: '1px solid #fde68a', display: 'flex', gap: 10 }}>
                   <span style={{ color: '#d97706', fontSize: 16 }}>ℹ</span>
                   <p style={{ margin: 0, fontSize: 13, color: '#92400e', lineHeight: 1.6 }}>
                     উত্তোলনের অনুরোধ প্রক্রিয়া হতে ১–১২ ঘণ্টা সময় লাগতে পারে।
                   </p>
                 </div>
               </form>
             )}
 
             {/* ══ HISTORY TAB ══ */}
             {tab === 'history' && (
               <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                 {dataLoading ? (
                   <p style={{ textAlign: 'center', color: '#9ca3af', marginTop: 40 }}>লোড হচ্ছে...</p>
                 ) : history.length === 0 ? (
                   <p style={{ textAlign: 'center', color: '#9ca3af', marginTop: 40 }}>কোনো ইতিহাস পাওয়া যায়নি।</p>
                 ) : (
                   history.map(item => (
                     <div key={item._id} style={{
                       background: '#fff', borderRadius: 14, padding: '16px',
                       border: '1px solid #f3f4f6', boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
                     }}>
                       <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                         <div>
                           <p style={{ margin: '0 0 2px', fontWeight: 700, fontSize: 18 }}>
                             ৳ {Number(item.amount).toLocaleString()}
                           </p>
                           <p style={{ margin: '0 0 2px', fontSize: 13, color: '#6b7280' }}>
                             {item.method} · {item.accountNo}
                           </p>
                           <p style={{ margin: 0, fontSize: 12, color: '#9ca3af' }}>
                             {formatDate(item.createdAt)}
                           </p>
                         </div>
                         <StatusBadge status={item.status} />
                       </div>
                       {item.trxId && (
                         <div style={{ marginTop: 10, padding: '8px 12px', background: '#f0fdf4', borderRadius: 8, fontSize: 13, color: '#15803d' }}>
                           TrxID: <b>{item.trxId}</b>
                         </div>
                       )}
                       {item.note && (
                         <div style={{
                           marginTop: item.trxId ? 6 : 10,
                           padding: '8px 12px', borderRadius: 8, fontSize: 13,
                           background: item.status === 'rejected' ? '#fff5f5' : '#fafafa',
                           color: item.status === 'rejected' ? '#c62828' : '#6b7280',
                           borderLeft: `3px solid ${item.status === 'rejected' ? '#ef4444' : '#d1d5db'}`,
                         }}>
                           {item.status === 'rejected' ? 'কারণ: ' : 'নোট: '}{item.note}
                         </div>
                       )}
                     </div>
                   ))
                 )}
               </div>
             )}
           </div>
         </div>
       </div>
     </>
   );
 };
 
 export default Withdraw;
 