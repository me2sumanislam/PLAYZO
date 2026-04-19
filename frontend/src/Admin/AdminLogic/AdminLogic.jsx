const MatchAdmin = ({ onAddMatch }) => {
  const [formData, setFormData] = useState({
    title: '', winPrize: '', entryFee: '', perKill: '', 
    mapName: 'Bermuda', total: 48, time: '', startsIn: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onAddMatch({ ...formData, id: Date.now(), joined: 0, version: 'MOBILE', type: 'Regular', entryType: 'Solo' });
    alert("ম্যাচ তৈরি হয়েছে!");
  };

  return (
    <div className="p-6 bg-white rounded-3xl shadow-xl max-w-md mx-auto my-10 border border-gray-100">
      <h2 className="text-2xl font-black mb-6 text-slate-800">Add New Match</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input type="text" placeholder="Match Title (e.g. Solo Time)" className="w-full p-3 border rounded-xl" onChange={e => setFormData({...formData, title: e.target.value})} required />
        <div className="grid grid-cols-2 gap-3">
          <input type="number" placeholder="Win Prize" className="p-3 border rounded-xl" onChange={e => setFormData({...formData, winPrize: e.target.value})} required />
          <input type="number" placeholder="Entry Fee" className="p-3 border rounded-xl" onChange={e => setFormData({...formData, entryFee: e.target.value})} required />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <input type="number" placeholder="Per Kill" className="p-3 border rounded-xl" onChange={e => setFormData({...formData, perKill: e.target.value})} required />
          <input type="text" placeholder="Map Name" className="p-3 border rounded-xl" defaultValue="Bermuda" onChange={e => setFormData({...formData, mapName: e.target.value})} />
        </div>
        <input type="text" placeholder="Start Time (e.g. 2026-04-19 at 09:40 PM)" className="w-full p-3 border rounded-xl" onChange={e => setFormData({...formData, time: e.target.value})} required />
        <input type="text" placeholder="Timer (e.g. 24m:43s)" className="w-full p-3 border rounded-xl" onChange={e => setFormData({...formData, startsIn: e.target.value})} required />
        <button type="submit" className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-bold shadow-lg">Publish Match</button>
      </form>
    </div>
  );
};