import React from "react";

const Contacts: React.FC = () => {
  return (
    <section
      id="contacts"
      className="bg-white py-16 mt-16 flex flex-col items-center"
    >
      <h2
        id="contact-title"
        className="text-[#fa4a0c] text-[2rem] font-semibold text-center mt-12 mx-auto px-8"
      >
        Fale Conosco
      </h2>

      <div id="contact-card" className="max-w-2xl mx-auto px-8 text-center ">
        <h3 className="text-[#fa4a0c] text-xl font-bold mb-4">
          Você possui alguma dúvida?
        </h3>
        <p className="text-gray-700 mb-6">
          Verifique se sua dúvida se encontra na nossa seção FAQs. Caso
          contrário, envie um email para entrar em contato com nosso suporte
          online 24h e responderemos o mais rápido possível.
        </p>

        <button
          id="contact-btn"
          className="bg-[#ff6b35] text-white px-6 py-2 rounded-md text-base md:px-10 md:py-4 md:text-xl font-semibold hover:bg-orange-500 transition"
        >
          Entrar em Contato
        </button>
      </div>
    </section>
  );
};

export default Contacts;
