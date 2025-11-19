import React, { useEffect, useState } from "react";
import "./Historico.css";
import "./Dashboard.css";
import "./DashboardDark.css";
import {
  serviceRequestService,
  ServiceRequest,
  ServiceRequestStatus,
} from "../services/serviceRequest.service";
import { ChatWindow } from "../components/ChatWindow";
import chatIcon from "../assets/chat.svg";
import { DashboardSidebar } from "../components/DashboardSidebar";

interface HistoricoEntry {
  valor: number;
  data: string;
  hora: string;
  tipoServico: string;
  endereco: string;
  clienteNome: string;
  contato?: string;
  clientProfilePicture?: string;
  serviceRequestId: number;
}

const Historico: React.FC = () => {
  const [historicoEntries, setHistoricoEntries] = useState<HistoricoEntry[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [showChatModal, setShowChatModal] = useState<boolean>(false);
  const [selectedServiceRequestId, setSelectedServiceRequestId] = useState<number | null>(null);
  const [theme, setTheme] = useState<"dark" | "light">(() => {
    const savedTheme = localStorage.getItem("dashboard-theme");
    return (savedTheme as "dark" | "light") || "dark";
  });

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
            serviceRequestId: req.id,
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

  const toggleTheme = () => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  };

  useEffect(() => {
    localStorage.setItem("dashboard-theme", theme);
  }, [theme]);

  return (
    <div className={`dashboard-layout ${theme === "light" ? "dashboard-light" : "dashboard-dark"}`}>
      <DashboardSidebar theme={theme} onThemeToggle={toggleTheme} />
      <main className={`dashboard-main ${theme === "light" ? "dashboard-light-main" : "dashboard-dark-main"}`}>
        <div className={`dashboard-content ${theme === "light" ? "dashboard-light-content" : "dashboard-dark-content"}`}>
          <div className={`dashboard-header ${theme === "light" ? "dashboard-light-header" : "dashboard-dark-header"}`}>
            <h1 className={`dashboard-title ${theme === "light" ? "dashboard-light-title" : "dashboard-dark-title"}`}>Histórico</h1>
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
                    <button
                      className="pending-chat-fab"
                      aria-label="Abrir chat"
                      onClick={() => {
                        setSelectedServiceRequestId(entry.serviceRequestId);
                        setShowChatModal(true);
                      }}
                    >
                      <img src={chatIcon} alt="" className="chat-icon" />
                    </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>

      {showChatModal && selectedServiceRequestId && (
        <div className="wallet-modal-overlay" onClick={() => setShowChatModal(false)}>
          <div className="chat-modal" onClick={(e) => e.stopPropagation()}>
            <ChatWindow
              serviceRequestId={selectedServiceRequestId}
              currentUserId={user?.id}
              currentUserRole="CHEF"
              status={ServiceRequestStatus.COMPLETED}
              onClose={() => setShowChatModal(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default Historico;
