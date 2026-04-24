 import React, { createContext, useContext, useEffect, useState } from "react";

const MatchContext = createContext();

export const useMatch = () => useContext(MatchContext);

export const MatchProvider = ({ children }) => {
  const [matches, setMatches] = useState([]);

  // 🔥 LIVE FETCH FROM BACKEND
  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/api/matches");
        const data = await res.json();
        setMatches(data);
      } catch {
        setMatches([]);
      }
    };

    load();
  }, []);

  return (
    <MatchContext.Provider value={{ matches, setMatches }}>
      {children}
    </MatchContext.Provider>
  );
};