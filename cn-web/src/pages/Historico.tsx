import React, { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import "./Historico.css";
import "./Dashboard.css";
import "./DashboardDark.css";
import {
  serviceRequestService,
  ServiceRequest,
  ServiceRequestStatus,
} from "../services/serviceRequest.service";
import { useAuth } from "../contexts/AuthContext";
import perfilVazio from "../assets/perfilvazio.png";

interface HistoricoEntry {
  valor: number;
  data: string;
  hora: string;
  tipoServico: string;
  endereco: string;
  clienteNome: string;
  contato?: string;
  clientProfilePicture?: string;
}

const Historico: React.FC = () => {
  const location = useLocation();
  const { user, logout } = useAuth();
  const [historicoEntries, setHistoricoEntries] = useState<HistoricoEntry[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    const loadHistorico = async () => {
      try {
        setIsLoading(true);
        setError("");
        const response = await serviceRequestService.listChefServiceRequests(1, 1000);

        const completedRequests = (response.items || []).filter(
          (req: ServiceRequest) => req.status === ServiceRequestStatus.COMPLETED
        );

        const mappedEntries: HistoricoEntry[] = completedRequests.map((req: ServiceRequest) => {
          const requestedDate = new Date(req.requested_date);
          const day = String(requestedDate.getDate()).padStart(2, "0");
          const month = String(requestedDate.getMonth() + 1).padStart(2, "0");
          const year = requestedDate.getFullYear();
          const hours = String(requestedDate.getHours()).padStart(2, "0");
          const minutes = String(requestedDate.getMinutes()).padStart(2, "0");

          const clientName = req.client_profile?.user?.name || "Cliente";
          const clientProfilePicture = req.client_profile?.user?.profilePictureUrl;
          const priceCents = req.quote?.amount_cents || 0;
          const priceBRL = priceCents / 100;

          return {
            valor: priceBRL,
            data: `${day}/${month}/${year}`,
            hora: `${hours}:${minutes}`,
            tipoServico: req.service_type || "Serviço",
            endereco: req.location || "",
            clienteNome: clientName,
            contato: req.client_profile?.user?.email || undefined,
            clientProfilePicture: clientProfilePicture,
          };
        });

        const sortedEntries = mappedEntries.sort((a, b) => {
          const dateA = new Date(a.data.split("/").reverse().join("-"));
          const dateB = new Date(b.data.split("/").reverse().join("-"));
          if (dateA.getTime() !== dateB.getTime()) {
            return dateB.getTime() - dateA.getTime();
          }
          return b.hora.localeCompare(a.hora);
        });

        setHistoricoEntries(sortedEntries);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erro ao carregar histórico");
        console.error("Erro ao carregar histórico:", err);
      } finally {
        setIsLoading(false);
      }
    };

    loadHistorico();
  }, []);

  const [profileImageError, setProfileImageError] = useState(false);
  const profilePicture = (user?.profilePictureUrl && !profileImageError) ? user.profilePictureUrl : perfilVazio;

  return (
    <div className="dashboard-dark-layout">
      <main className="dashboard-dark-main">
        <div className="dashboard-dark-content">
          <div className="dashboard-dark-header">
            <h1 className="dashboard-dark-title">Histórico</h1>
            <nav className="dashboard-dark-nav">
              <Link
                to="/dashboard"
                className={`dashboard-dark-nav-link ${
                  location.pathname === "/dashboard" || location.pathname === "/"
                    ? "active"
                    : ""
                }`}
              >
                Dashboard
              </Link>
              <Link
                to="/agendamentos"
                className={`dashboard-dark-nav-link ${
                  location.pathname === "/agendamentos" ||
                  location.pathname === "/preview/agendamentos"
                    ? "active"
                    : ""
                }`}
              >
                Agendamentos
              </Link>
              <Link
                to="/historico"
                className={`dashboard-dark-nav-link ${
                  location.pathname === "/historico" ? "active" : ""
                }`}
              >
                Histórico
              </Link>
              <Link to="/perfil">
                <img
                  src={profilePicture}
                  alt="Perfil"
                  className="dashboard-dark-nav-profile"
                  onError={() => setProfileImageError(true)}
                />
              </Link>
              <button
                className="dashboard-dark-nav-link"
                onClick={logout}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  fontFamily: "inherit",
                  fontSize: "inherit",
                  fontWeight: "inherit",
                }}
              >
                Sair
              </button>
            </nav>
          </div>

          {isLoading ? (
            <div className="dashboard-dark-card">
              <div className="historico-empty">
                <p>Carregando histórico...</p>
              </div>
            </div>
          ) : error ? (
            <div className="dashboard-dark-card">
              <div className="historico-error">
                <p>{error}</p>
              </div>
            </div>
          ) : historicoEntries.length === 0 ? (
            <div className="dashboard-dark-card">
              <div className="historico-empty">
                <p>Nenhum serviço concluído encontrado.</p>
              </div>
            </div>
          ) : (
            <div className="dashboard-dark-card">
              <div className="historico-list">
                {historicoEntries.map((entry, index) => (
                  <div key={index} className="historico-entry">
                  <div className="entry-header">
                    <span className="entry-value">
                      R${" "}
                      {entry.valor.toLocaleString("pt-BR", {
                        minimumFractionDigits: 2,
                      })}
                    </span>
                    <span className="entry-date-time">
                      {entry.data} - {entry.hora}
                    </span>
                  </div>
                  <div className="entry-content">
                    <div className="entry-avatar-container">
                      {entry.clientProfilePicture ? (
                        <img
                          src={entry.clientProfilePicture}
                          alt={entry.clienteNome}
                          className="entry-client-avatar"
                        />
                      ) : (
                        <div className="entry-client-avatar-placeholder">
                          {entry.clienteNome.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div className="entry-details">
                      <p className="entry-service">
                        {entry.tipoServico}: {entry.endereco}
                      </p>
                      <p className="entry-client">
                        {entry.clienteNome}
                        {entry.contato && ` - Contato: ${entry.contato}`}
                      </p>
                    </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Historico;
