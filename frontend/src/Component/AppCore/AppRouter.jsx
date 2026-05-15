 import React from "react";
import { Routes, Route } from "react-router-dom";

import AppDashboard from "../AppDashBoard/AppDeshBoard";
import Profile from "../../page/Profile/profile";
import Wallet from "../../page/Wallet/Wallet";

const AppRouter = ({ onLogout }) => {
  return (
    <Routes>

      {/* MAIN APP */}
      <Route path="/" element={<AppDashboard onLogout={onLogout} />} />

      {/* PROFILE */}
      <Route path="/profile" element={<Profile onLogout={onLogout} />} />

      {/* WALLET */}
      <Route path="/wallet" element={<Wallet />} />

    </Routes>
  );
};

export default AppRouter;