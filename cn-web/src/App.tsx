import React from "react";
import { Routes, Route } from "react-router-dom";
import "./App.css";
import HomePage from "./pages/HomePage";
import Dashboard from "./pages/Dashboard";
import Historico from "./pages/Historico";
import ChefsPage from "./pages/ChefsPage";
import AppointmentsPage from "./pages/AppointmentsPage";
import AppointmentsMockPage from "./pages/AppointmentsMockPage";
import ProfilePage from "./pages/ProfilePage";
import ProfileMockPage from "./pages/ProfileMockPage";
import { ProtectedRoute } from "./components/ProtectedRoute";

const App: React.FC = () => {
  return (
    <div className="App">
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/preview/agendamentos" element={<AppointmentsMockPage />} />
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/agendamentos" 
          element={
            <ProtectedRoute>
              <AppointmentsPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/historico" 
          element={
            <ProtectedRoute>
              <Historico />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/perfil" 
          element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          } 
        />
        <Route path="/preview/perfil" element={<ProfileMockPage />} />
        <Route path="/chefs" element={<ChefsPage />} />
      </Routes>
    </div>
  );
};

export default App;
