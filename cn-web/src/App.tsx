import React from "react";
import { Routes, Route } from "react-router-dom";
import "./App.css";
import HomePage from "./pages/HomePage";
import Dashboard from "./pages/Dashboard";
import Historico from "./pages/Historico";
import ChefsPage from "./pages/ChefsPage";
import ProfilePage from "./pages/ProfilePage";
import ProfileMockPage from "./pages/ProfileMockPage";
import { ProtectedRoute } from "./components/ProtectedRoute";

const App: React.FC = () => {
  return (
    <div className="App">
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute>
              <Dashboard />
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
