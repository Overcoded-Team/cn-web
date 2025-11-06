import React from "react";
import { Link, useLocation } from "react-router-dom";
import "./Historico.css";

const Historico: React.FC = () => {
  const location = useLocation();

  const chefData = {
    nome: "Emily Costa",
    perfilImagem: "https://via.placeholder.com/160",
  };

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
      <aside className="historico-sidebar">
        <div className="sidebar-content">
          <div className="chef-profile">
            <div className="profile-photo">
              <img
                src={chefData.perfilImagem}
                alt={`Chef ${chefData.nome}`}
                className="chef-avatar"
              />
            </div>
            <div className="chef-info">
              <p className="chef-label">Chef</p>
              <p className="chef-name">{chefData.nome}</p>
            </div>
            <div className="social-media-icons">
              <a href="#" className="social-icon" aria-label="Facebook">
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
              </a>
              <a href="#" className="social-icon" aria-label="Instagram">
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                </svg>
              </a>
              <a href="#" className="social-icon" aria-label="X (Twitter)">
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              </a>
            </div>
          </div>

          <nav className="sidebar-nav">
            <Link
              to="/dashboard"
              className={`nav-item ${
                location.pathname === "/dashboard" || location.pathname === "/"
                  ? "active"
                  : ""
              }`}
            >
              Dashboard
            </Link>
            <a href="#" className="nav-item">
              Perfil
            </a>
            <a href="#" className="nav-item">
              Agendamentos
            </a>
            <Link
              to="/historico"
              className={`nav-item ${
                location.pathname === "/historico" ? "active" : ""
              }`}
            >
              Histórico
            </Link>
          </nav>
        </div>
      </aside>

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
