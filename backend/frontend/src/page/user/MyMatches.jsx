 import React, { useState, useEffect } from 'react';
import axios from 'axios';

const MyMatches = () => {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);

  // My Matches লোড করার ফাংশন
  const fetchMyMatches = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/matches/my-matches', {   // তোমার API অনুযায়ী চেঞ্জ করো
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setMatches(res.data.data || res.data);   // তোমার রেসপন্স স্ট্রাকচার অনুযায়ী
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyMatches();
  }, []);

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">My Matches</h1>
        <button 
          onClick={fetchMyMatches}
          className="bg-blue-600 text-white px-5 py-2 rounded-lg text-sm hover:bg-blue-700"
        >
          ↻ Refresh
        </button>
      </div>

      {loading && <p>Loading matches...</p>}

      <div className="space-y-4">
        {matches.map((match) => (
          <div key={match._id} className="bg-white rounded-2xl shadow p-5 border">
            <div className="flex justify-between">
              <div>
                <h3 className="font-semibold">{match.title}</h3>
                <p className="text-sm text-gray-500">Prize Pool: ৳{match.prizePool}</p>
              </div>
              <span className={`px-4 py-1.5 rounded-full text-sm font-medium ${
                match.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
              }`}>
                {match.status === 'completed' ? '✅ Completed' : match.status}
              </span>
            </div>

            {/* Room Details */}
            {match.roomId && match.status !== 'completed' && (
              <div className="mt-4 p-4 bg-gray-50 rounded-xl">
                <p><strong>Room ID:</strong> {match.roomId}</p>
                <p><strong>Password:</strong> {match.roomPassword || match.password}</p>
              </div>
            )}

            {/* Result Button */}
            {match.status === 'completed' && (
              <button 
                onClick={() => alert('Result দেখানো হবে')}   // পরে Modal বানাবো
                className="mt-4 w-full bg-green-600 text-white py-3 rounded-xl font-medium"
              >
                View Result & Prize
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default MyMatches;