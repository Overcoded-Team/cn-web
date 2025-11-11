import React from "react";
import "./Historico.css";
import "./Dashboard.css";
import { DashboardSidebar } from "../components/DashboardSidebar";

const Historico: React.FC = () => {

  const historicoEntries = [
    {
      valor: 252.0,
      data: "04/11/2025",
      hora: "18:00",
      tipoServico: "Atendimento a domicilio",
      endereco: "Av. Brasil, 1875 Zona 03 - Maringá - PR",
      clienteNome: "Jorge da Silva",
      contato: "(44)99988-4512",
    },
    {
      valor: 415.0,
      data: "21/10/2025",
      hora: "21:00",
      tipoServico: "Evento Privado",
      endereco: "Av. JK, 1376 - Maringá - PR",
      clienteNome: "Maria Souza",
      contato: "(44)99876-5432",
    },
    {
      valor: 210.0,
      data: "15/10/2025",
      hora: "14:00",
      tipoServico: "Evento Privado",
      endereco:
        "Rua Pioneiro Geraldo M. da Silva, 450 - Zona 08 - Maringá - PR",
      clienteNome: "João Moraes",
      contato: "(44)99999-9999",
    },
    {
      valor: 500.0,
      data: "20/09/2025",
      hora: "20:00",
      tipoServico: "Atendimento a domicilio",
      endereco: "Avenida Mauá, 1230 - Centro - Maringá - PR",
      clienteNome: "Indiana Jones",
      contato: "(44)99988-4512",
    },
    {
      valor: 497.0,
      data: "19/09/2025",
      hora: "18:00",
      tipoServico: "Atendimento a domicilio",
      endereco:
        "Rua Pioneiro Guarino Augusto Basilio, 200 - Parque Industrial - Maringá - PR",
      clienteNome: "Alexandre Andrade",
      contato: "(44)99988-4512",
    },
    {
      valor: 252.0,
      data: "04/11/2025",
      hora: "18:00",
      tipoServico: "Atendimento a domicilio",
      endereco: "Av. Brasil, 1875 Zona 03 - Maringá - PR",
      clienteNome: "Jorge da Silva",
      contato: "(44)99988-4512",
    },
    {
      valor: 305.0,
      data: "04/11/2025",
      hora: "18:00",
      tipoServico: "Atendimento a domicilio",
      endereco: "Rua Exemplo, 123 - Centro - Maringá - PR",
      clienteNome: "Pedro Santos",
      contato: "(44)98877-6655",
    },
  ];

  return (
    <div className="historico-layout">
      <DashboardSidebar className="historico-sidebar" />

      <main className="historico-main">
        <div className="main-content">
          <div className="historico-title-wrapper">
            <h1 className="historico-title">Histórico</h1>
          </div>

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
                    {entry.clienteNome} - Contato: {entry.contato}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Historico;
