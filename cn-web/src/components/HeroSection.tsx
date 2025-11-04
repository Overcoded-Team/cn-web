import React from "react";
import { useState } from "react";
import RegisterModal from "./RegisterModal";

const HeroSection: React.FC = () => {
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);

  const handleRegisterClick = () => {
    setIsRegisterModalOpen(true);
  };

  const handleCloseRegisterModal = () => {
    setIsRegisterModalOpen(false);
  };

  const handleSwitchToLogin = () => {
    setIsRegisterModalOpen(false);
  };

  return (
    <>
      <section className="hero">
        <div className="hero-content">
          <h1>Transforme sua paixão em negócio.</h1>
          <h2 className="subtitle">Junte-se ao ChefNow.</h2>
          <p>
            Conecte-se a clientes exclusivos, gerencie seus eventos e brilhe com
            seus talentos culinários.
          </p>
          <button onClick={handleRegisterClick} className="btn-hero">Cadastrar-se como Chef</button>
        </div>
      </section>
      
      <RegisterModal 
        isOpen={isRegisterModalOpen} 
        onClose={handleCloseRegisterModal}
        onSwitchToLogin={handleSwitchToLogin}
      />
    </>
  );
};

export default HeroSection;
