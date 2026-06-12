import React, { useState } from "react";
import { Routes, Route, Navigate, Outlet } from "react-router-dom";
import Login from "./Components/Login/Login";
import Dashboard from "./Components/Dashboard/Dashboard";
import PoemsPortal from "./Components/PortalPoemas/PoemsPortal";
import TimeLine from "./Components/LineadeTiempo/TimeLine";
import HomeContent from "./Components/HomeContent";
import Galeria from "./Components/Galeria/Galeria"
import CumpleanosCard from "./Components/DiaEspecial/Cumpleaños/Cumpleanoscard";
import Cummpleanosfiesta from "./Components/DiaEspecial/Cumpleaños/Cumpleanosfiesta";
import "./App.css";

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(
    sessionStorage.getItem("portal_logged_in") === "true",
  );
  const [despidiendo, setDespidiendo] = useState(false);

  const handleLoginSuccess = () => {
    setIsLoggedIn(true);
    sessionStorage.setItem("portal_logged_in", "true");
  };

  const handleLogout = async () => {
    setDespidiendo(true);
    await new Promise((resolve) => setTimeout(resolve, 3500));
    setDespidiendo(false);
    setIsLoggedIn(false);
    sessionStorage.removeItem("portal_logged_in");
  };

  const ProtectedLayout = () => {
    if (!isLoggedIn && !despidiendo) return <Navigate to="/" replace />;
    return <Dashboard handleLogout={handleLogout} />;
  };

  return (
    <div className="App">
      {/* OVERLAY DE DESPEDIDA — fuera de Routes para que persista */}
      {despidiendo && (
        <div className="despedida-overlay">
          <p className="despedida-texto">Hasta pronto, Mis Ojitos 💚</p>
        </div>
      )}

      <Routes>
        <Route
          path="/"
          element={
            isLoggedIn ? (
              <Navigate to="/dashboard" />
            ) : (
              <Login onLoginSuccess={handleLoginSuccess} />
            )
          }
        />
        <Route path="/dashboard" element={<ProtectedLayout />}>
          <Route index element={<HomeContent />} />
          <Route path="PoemsPortal" element={<PoemsPortal />} />
          <Route path="TimeLine" element={<TimeLine />} />
          <Route path="Galeria" element={<Galeria />} />
          <Route path="Cumpleanoscard" element={<CumpleanosCard />} />
          <Route path="Cumpleanosfiesta" element={<Cummpleanosfiesta />} />
        </Route>
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </div>
  );
}

export default App;
