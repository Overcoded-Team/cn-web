import React from "react";
import "./Contacts.css";

const Contacts: React.FC = () => {
  return (
    <section id="contacts" className="contacts-section">
      <div className="contacts-container">
        <h2 className="contacts-title">Fale Conosco</h2>
        <h3 className="contacts-subtitle">Você Possui alguma dúvida?</h3>
        <p className="contacts-description">
          Verifique se sua dúvida se encontra na nossa seção FAQs. Caso
          contrário, envie um email para entrar em contato com nosso suporte
          online 24h e responderemos o mais rápido possível.
        </p>
        <button className="contact-button">Entrar em contato</button>
      </div>
    </section>
  );
};

export default Contacts;
