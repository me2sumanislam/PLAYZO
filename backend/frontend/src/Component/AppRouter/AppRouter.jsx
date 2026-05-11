 import React from "react";
import { Routes, Route, Navigate, useNavigate } from "react-router-dom";

import AppDashboard from "../AppDashBoard/AppDeshBoard";
import Profile from "../../page/Profile/profile";
import Wallet from "../../page/Wallet/Wallet";

const AppRouter = ({ onLogout }) => {
  const navigate = useNavigate();

  return (
    <Routes>
      {/* HOME */}
      <Route path="/" element={<AppDashboard onLogout={onLogout} />} />

      {/* PROFILE */}
      <Route path="/profile" element={<Profile onLogout={onLogout} />} />

      {/* WALLET */}
      <Route
        path="/wallet"
        element={<Wallet onBack={() => navigate("/profile")} />}
      />

      {/* UNKNOWN PAGE */}
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
};

export default AppRouter;