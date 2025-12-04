import React, { useState } from "react";
import "./FAQ.css";

interface FAQItem {
  question: string;
  answer: string;
}

const FAQ: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqItems: FAQItem[] = [
    {
      question: "Como funciona o agendamento?",
      answer:
        "Você define sua disponibilidade na plataforma e os clientes podem reservar diretamente. Você recebe notificações em tempo real e pode aceitar ou recusar solicitações.",
    },
    {
      question: "Como recebo meus pagamentos?",
      answer:
        "Pagamento via PIX antes do evento. O cliente paga o valor total (seu valor + taxa). O valor é creditado na sua carteira após confirmação e você pode solicitar saque via PIX.",
    },
    {
      question: "Preciso pagar para me cadastrar?",
      answer:
        "Não! O cadastro é totalmente gratuito. A plataforma cobra apenas uma taxa de 15% do valor do serviço + R$ 0,80 fixo quando você recebe um pagamento. O cliente paga o valor total e você recebe 100% do valor que cotou.",
    },
    {
      question: "Como posso destacar meu perfil?",
      answer:
        "Complete seu perfil com informações detalhadas, adicione fotos de alta qualidade dos seus pratos, crie cardápios atrativos e mantenha suas avaliações positivas. Um perfil completo e bem avaliado aparece mais nas buscas.",
    },
  ];

  const toggleItem = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section id="faqs" className="faq-section">
      <h2 className="faq-title">Perguntas Frequentes</h2>
      <div className="faq-container">
        {faqItems.map((item, index) => (
          <div
            key={index}
            className={`faq-item ${openIndex === index ? "open" : ""}`}
          >
            <button
              className="faq-question"
              onClick={() => toggleItem(index)}
              aria-expanded={openIndex === index}
            >
              <span className="faq-question-text">{item.question}</span>
              <svg
                className={`faq-chevron ${
                  openIndex === index ? "faq-chevron-open" : ""
                }`}
                width="20"
                height="20"
                viewBox="0 0 20 20"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M7.5 5L12.5 10L7.5 15"
                  stroke="#fa4a0c"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
            {openIndex === index && (
              <div className="faq-answer">
                <p>{item.answer}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
};

export default FAQ;
