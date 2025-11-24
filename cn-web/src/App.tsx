import React, { lazy, Suspense } from "react";
import { Routes, Route } from "react-router-dom";
import "./App.css";
import HomePage from "./pages/HomePage";
import ChefsPage from "./pages/ChefsPage";
import { ProtectedRoute } from "./components/ProtectedRoute";

const Dashboard = lazy(() => import("./pages/Dashboard"));
const Historico = lazy(() => import("./pages/Historico"));
const Posts = lazy(() => import("./pages/Posts"));
const AppointmentsPage = lazy(() => import("./pages/AppointmentsPage"));
const ProfilePage = lazy(() => import("./pages/ProfilePage"));

const LoadingSpinner = () => (
  <div style={{ 
    display: 'flex', 
    justifyContent: 'center', 
    alignItems: 'center', 
    height: '100vh',
    fontSize: '1.2rem',
    color: '#666'
  }}>
    Carregando...
  </div>
);

const App: React.FC = () => {
  return (
    <div className="App">
      <Suspense fallback={<LoadingSpinner />}>
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
            path="/posts"
            element={
              <ProtectedRoute>
                <Posts />
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
          <Route path="/chefs" element={<ChefsPage />} />
        </Routes>
      </Suspense>
    </div>
  );
};

export default App;
