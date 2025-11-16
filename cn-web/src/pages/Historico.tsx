import React, { useEffect, useState } from "react";
import "./Historico.css";
import "./Dashboard.css";
import { DashboardSidebar } from "../components/DashboardSidebar";
import {
  serviceRequestService,
  ServiceRequest,
  ServiceRequestStatus,
} from "../services/serviceRequest.service";

interface HistoricoEntry {
  valor: number;
  data: string;
  hora: string;
  tipoServico: string;
  endereco: string;
  clienteNome: string;
  contato?: string;
}

const Historico: React.FC = () => {
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
          const priceCents = req.quote?.total_cents || req.quote?.amount_cents || 0;
          const priceBRL = priceCents / 100;

          return {
            valor: priceBRL,
            data: `${day}/${month}/${year}`,
            hora: `${hours}:${minutes}`,
            tipoServico: req.service_type || "Serviço",
            endereco: req.location || "",
            clienteNome: clientName,
            contato: req.client_profile?.user?.email || undefined,
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

  return (
    <div className="historico-layout">
      <DashboardSidebar className="historico-sidebar" />

      <main className="historico-main">
        <div className="main-content">
          <div className="historico-title-wrapper">
            <h1 className="historico-title">Histórico</h1>
          </div>

          {isLoading ? (
            <div className="historico-list">
              <div className="historico-entry">
                <p style={{ textAlign: "center", padding: "2rem", color: "#666" }}>
                  Carregando histórico...
                </p>
              </div>
            </div>
          ) : error ? (
            <div className="historico-list">
              <div className="historico-entry">
                <p style={{ textAlign: "center", padding: "2rem", color: "#f44336" }}>
                  {error}
                </p>
              </div>
            </div>
          ) : historicoEntries.length === 0 ? (
            <div className="historico-list">
              <div className="historico-entry">
                <p style={{ textAlign: "center", padding: "2rem", color: "#666" }}>
                  Nenhum serviço concluído encontrado.
                </p>
              </div>
            </div>
          ) : (
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
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Historico;
