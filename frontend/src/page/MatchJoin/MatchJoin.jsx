 import React, { useState } from 'react';

const MatchJoin = ({ match, onBack, onConfirmJoin }) => {
  const [formData, setFormData] = useState({
    userName: '',
    gameId: ''
  });

  if (!match) return null;

  return (
    <div className="bg-[#fcfaff] min-h-screen max-w-[450px] mx-auto">

      <button onClick={onBack}>❮</button>

      <h2>{match.title}</h2>

      <input
        placeholder="Game Name"
        onChange={(e) => setFormData({ ...formData, userName: e.target.value })}
      />

      <input
        placeholder="UID"
        onChange={(e) => setFormData({ ...formData, gameId: e.target.value })}
      />

      <button onClick={() => onConfirmJoin(formData)}>
        Confirm Join
      </button>

    </div>
  );
};

export default MatchJoin;