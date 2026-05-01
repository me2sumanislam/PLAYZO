 import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const METHODS = ['bKash', 'Nagad', 'Rocket'];

const METHOD_COLORS = {
  bKash: { bg: '#fce4ec', text: '#c2185b', border: '#f48fb1', active: '#e91e63' },
  Nagad: { bg: '#fff3e0', text: '#e65100', border: '#ffcc80', active: '#ff6f00' },
  Rocket: { bg: '#ede7f6', text: '#4527a0', border: '#b39ddb', active: '#673ab7' },
};

const Withdraw = () => {
  const navigate = useNavigate();
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('bKash');
  const [accountNo, setAccountNo] = useState('');
  const [loading, setLoading] = useState(false);
  const [balance, setBalance] = useState(0);
  const [history, setHistory] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [tab, setTab] = useState('form');

  const token = localStorage.getItem('token');
  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [balRes, histRes] = await Promise.all([
        axios.get(`${API}/api/users/balance`, { headers }),
        axios.get(`${API}/api/withdraw/my`, { headers }),
      ]);
      setBalance(balRes.data.balance || 0);
      setHistory(histRes.data || []);
    } catch {
      // silent fail
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const numAmount = Number(amount);
    if (numAmount < 500) return setError('Minimum withdrawal amount is ৳500.');
    if (numAmount > balance) return setError('Insufficient balance.');
    if (!/^01[3-9]\d{8}$/.test(accountNo)) return setError('Please enter a valid Bangladeshi mobile number.');

    setLoading(true);
    try {
      await axios.post(`${API}/api/withdraw/request`, { amount: numAmount, method, accountNo }, { headers });
      setSuccess('Withdrawal request submitted successfully!');
      setAmount('');
      setAccountNo('');
      fetchData();
      setTimeout(() => setTab('history'), 1200);
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const statusBadge = (status) => {
    const map = {
      pending: { bg: '#fff8e1', color: '#f57f17', label: 'Pending' },
      approved: { bg: '#e8f5e9', color: '#2e7d32', label: 'Approved' },
      rejected: { bg: '#ffebee', color: '#c62828', label: 'Rejected' },
    };
    const s = map[status] || map.pending;
    return (
      <span style={{
        background: s.bg, color: s.color,
        padding: '2px 10px', borderRadius: 20,
        fontSize: 12, fontWeight: 600,
      }}>{s.label}</span>
    );
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f5f6fa', fontFamily: "'Hind Siliguri', 'Segoe UI', sans-serif", paddingBottom: 80 }}>
      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)', padding: '16px 20px 32px', color: '#fff' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
          <button onClick={() => navigate(-1)} style={{
            background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: '50%',
            width: 36, height: 36, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff',
            WebkitTapHighlightColor: 'transparent',
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>Withdraw Money</h1>
        </div>

        {/* Balance Card */}
        <div style={{
          background: 'rgba(255,255,255,0.15)', borderRadius: 16, padding: '20px 24px',
          backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.25)',
          textAlign: 'center',
        }}>
          <p style={{ margin: '0 0 4px', fontSize: 13, opacity: 0.8, textTransform: 'uppercase', letterSpacing: 1 }}>Available Balance</p>
          <h2 style={{ margin: 0, fontSize: 36, fontWeight: 800, letterSpacing: -1 }}>
            ৳ {balance.toLocaleString('bn-BD')}
          </h2>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', margin: '-16px 16px 0', background: '#fff', borderRadius: 12, padding: 4, boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }}>
        {[['form', 'New Request'], ['history', 'History']].map(([key, label]) => (
          <button key={key} onClick={() => setTab(key)} style={{
            flex: 1, padding: '10px', border: 'none', borderRadius: 9, cursor: 'pointer',
            fontWeight: 600, fontSize: 14, transition: 'all 0.2s',
            background: tab === key ? '#1e3a8a' : 'transparent',
            color: tab === key ? '#fff' : '#6b7280',
            WebkitTapHighlightColor: 'transparent',
          }}>{label}</button>
        ))}
      </div>

      <div style={{ padding: '24px 16px 0' }}>
        {tab === 'form' && (
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: 20 }}>
              <p style={{ margin: '0 0 10px', fontWeight: 600, fontSize: 14, color: '#374151' }}>Payment Method</p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
                {METHODS.map((m) => {
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
                      WebkitTapHighlightColor: 'transparent',
                    }}>{m}</button>
                  );
                })}
              </div>
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', marginBottom: 6, fontWeight: 600, fontSize: 14, color: '#374151' }}>Withdrawal Amount</label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', fontWeight: 700, color: '#6b7280', fontSize: 16 }}>৳</span>
                <input
                  type="number" inputMode="numeric" min="500" max={balance} value={amount}
                  onChange={(e) => setAmount(e.target.value)} required placeholder="Enter amount"
                  style={{ width: '100%', boxSizing: 'border-box', padding: '14px 16px 14px 36px', border: '1.5px solid #e5e7eb', borderRadius: 12, fontSize: 16, background: '#f9fafb', outline: 'none', fontFamily: 'inherit' }}
                />
              </div>
              <p style={{ margin: '6px 0 0', fontSize: 12, color: '#9ca3af' }}>Minimum: ৳500 · Maximum: ৳{balance.toLocaleString()}</p>
            </div>

            <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
              {[500, 1000, 2000, 5000].filter(v => v <= balance).map(v => (
                <button key={v} type="button" onClick={() => setAmount(String(v))} style={{
                  flex: 1, padding: '8px 4px', border: '1px solid #e5e7eb', borderRadius: 8,
                  background: amount === String(v) ? '#1e3a8a' : '#f3f4f6',
                  color: amount === String(v) ? '#fff' : '#6b7280',
                  fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s',
                }}>৳{v >= 1000 ? `${v / 1000}k` : v}</button>
              ))}
            </div>

            <div style={{ marginBottom: 24 }}>
              <label style={{ display: 'block', marginBottom: 6, fontWeight: 600, fontSize: 14, color: '#374151' }}>{method} Account Number</label>
              <input
                type="tel" inputMode="numeric" value={accountNo} onChange={(e) => setAccountNo(e.target.value)}
                placeholder="01XXXXXXXXX" required maxLength={11}
                style={{ width: '100%', boxSizing: 'border-box', padding: '14px 16px', border: '1.5px solid #e5e7eb', borderRadius: 12, fontSize: 16, background: '#f9fafb', outline: 'none', fontFamily: 'inherit' }}
              />
            </div>

            {error && <div style={{ background: '#ffebee', border: '1px solid #ef9a9a', borderRadius: 10, padding: '12px 16px', marginBottom: 16, color: '#b71c1c', fontSize: 14 }}>{error}</div>}
            {success && <div style={{ background: '#e8f5e9', border: '1px solid #a5d6a7', borderRadius: 10, padding: '12px 16px', marginBottom: 16, color: '#1b5e20', fontSize: 14 }}>{success}</div>}

            <button type="submit" disabled={loading} style={{
              width: '100%', padding: '16px', borderRadius: 14, border: 'none',
              background: loading ? '#93c5fd' : 'linear-gradient(135deg, #1e3a8a, #3b82f6)',
              color: '#fff', fontWeight: 700, fontSize: 16, cursor: loading ? 'not-allowed' : 'pointer',
              boxShadow: '0 4px 15px rgba(59,130,246,0.35)', fontFamily: 'inherit'
            }}>
              {loading ? 'Submitting...' : 'Submit Withdrawal Request'}
            </button>

            <div style={{ marginTop: 20, padding: '14px 16px', background: '#fffbeb', borderRadius: 12, border: '1px solid #fde68a', display: 'flex', gap: 10 }}>
              <span style={{ color: '#d97706', fontSize: 16 }}>ℹ</span>
              <p style={{ margin: 0, fontSize: 13, color: '#92400e', lineHeight: 1.6 }}>Withdrawal request process হতে 1–12 ঘণ্টা সময় লাগতে পারে।</p>
            </div>
          </form>
        )}

        {tab === 'history' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {history.length === 0 ? <p style={{ textAlign: 'center', color: '#9ca3af', marginTop: 40 }}>No history found.</p> :
              history.map((item) => (
                <div key={item._id} style={{ background: '#fff', borderRadius: 14, padding: '16px', border: '1px solid #f3f4f6' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <p style={{ margin: 0, fontWeight: 700, fontSize: 18 }}>৳ {Number(item.amount).toLocaleString()}</p>
                      <p style={{ margin: 0, fontSize: 12, color: '#9ca3af' }}>{item.method} · {item.accountNo}</p>
                    </div>
                    {statusBadge(item.status)}
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Withdraw;