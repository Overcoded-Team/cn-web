import React from "react";
import { useState } from "react";

const HeroSection: React.FC = () => {
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);

  const handleRegisterClick = () => {
    setIsRegisterModalOpen(true);
  };

  const handleCloseRegisterModal = () => {
    setIsRegisterModalOpen(false);
  };

  return (
    <section className="hero">
      <div className="hero-content">
        <h1>Transforme sua paixão em negócio.</h1>
        <h2 className="subtitle">Junte-se ao ChefNow.</h2>
        <p>
          Conecte-se a clientes exclusivos, gerencie seus eventos e brilhe com
          seus talentos culinários.
        </p>
        <a className="btn-hero">Cadastrar-se como Chef</a>
      </div>
    </section>
  );
};

export default HeroSection;
