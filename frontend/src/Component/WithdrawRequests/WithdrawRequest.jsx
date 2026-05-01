 import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const WithdrawRequests = ({ adminName }) => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [note, setNote] = useState('');
  const [trxId, setTrxId] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const token = localStorage.getItem('token');
  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      const res = await axios.get(`${API}/api/withdraw/admin/all`, { headers });
      setRequests(res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (id, action) => {
    if (action === 'reject' && !note) {
      return alert("Please provide reject reason");
    }

    setActionLoading(true);
    try {
      await axios.put(
        `${API}/api/withdraw/admin/${action}/${id}`,
        { adminName, note, trxId },
        { headers }
      );

      setModal(null);
      setNote('');
      setTrxId('');
      fetchRequests();
    } catch (err) {
      alert(err.response?.data?.message || "Error");
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) return <div style={{ textAlign: 'center' }}>Loading...</div>;

  return (
    <div style={{ padding: 20, maxWidth: 900, margin: '0 auto' }}>
      <h2>Withdraw Requests</h2>

      {requests.map((item) => (
        <div key={item._id} style={{
          background: '#fff',
          padding: 15,
          marginBottom: 10,
          borderRadius: 10,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <h4>{item.user?.phone}</h4>
            <p>৳ {item.amount} ({item.method})</p>
            <p>{item.accountNo}</p>
          </div>

          {item.status === 'pending' && (
            <button onClick={() => setModal(item)}>
              Review
            </button>
          )}
        </div>
      ))}

      {/* ================= MODAL ================= */}
      {modal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.6)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 99999
        }}>
          <div style={{
            background: '#fff',
            width: 400,
            padding: 20,
            borderRadius: 12,
            position: 'relative'
          }}>

            {/* ❌ CLOSE BUTTON FIX */}
            <button
              onClick={() => setModal(null)}
              style={{
                position: 'absolute',
                top: 10,
                right: 10,
                width: 35,
                height: 35,
                borderRadius: '50%',
                border: 'none',
                background: '#eee',
                fontWeight: 'bold',
                cursor: 'pointer'
              }}
            >
              ✕
            </button>

            <h3>Process Withdrawal</h3>

            <p><b>User:</b> {modal.user?.phone}</p>
            <p><b>Amount:</b> ৳{modal.amount}</p>
            <p><b>Method:</b> {modal.method}</p>
            <p><b>Account:</b> {modal.accountNo}</p>

            <input
              placeholder="TrxID (optional)"
              value={trxId}
              onChange={(e) => setTrxId(e.target.value)}
              style={{ width: '100%', padding: 10, marginTop: 10 }}
            />

            <textarea
              placeholder="Admin note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              style={{ width: '100%', padding: 10, marginTop: 10 }}
            />

            <div style={{ display: 'flex', gap: 10, marginTop: 15 }}>
              <button
                onClick={() => handleAction(modal._id, 'reject')}
                style={{ flex: 1, background: 'red', color: '#fff' }}
              >
                Reject
              </button>

              <button
                onClick={() => handleAction(modal._id, 'approve')}
                style={{ flex: 1, background: 'green', color: '#fff' }}
              >
                {actionLoading ? "Loading..." : "Approve"}
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};

export default WithdrawRequests;