import React, { useRef } from "react";
import calendarioIcon from "../assets/calendario.svg";
import pagamentoIcon from "../assets/pagamento.svg";
import chefIcon from "../assets/iconecard.png";
import cancelamentoIcon from "../assets/cancelamento.svg";
import dinheiroIcon from "../assets/dinheiro.svg";
import avaliacaoIcon from "../assets/avaliacao.svg";
import "./FAQ.css";

const FAQ: React.FC = () => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({
        left: -350,
        behavior: "smooth",
      });
    }
  };

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({
        left: 350,
        behavior: "smooth",
      });
    }
  };

  return (
    <section id="faqs" className="features faq-section">
      <h2 className="faq-title">Perguntas Frequentes</h2>
      <div className="faq-carousel-wrapper">
        <button
          onClick={scrollLeft}
          className="carousel-nav-button carousel-nav-left"
        >
          ‹
        </button>
        <div className="faq-carousel-container" ref={scrollContainerRef}>
          <div className="feature-card">
            <div className="feature-icon calendar">
              <img src={calendarioIcon} alt="Pergunta" />
            </div>
            <h3>Como funciona o agendamento?</h3>
            <p>
              Cliente solicita um serviço, você aceita ou rejeita. Ao aceitar,
              envie um orçamento. Após o pagamento, o agendamento é confirmado.
            </p>
            <p className="highlight">Fluxo simples do pedido ao serviço</p>
          </div>

          <div className="feature-card">
            <div className="feature-icon payment">
              <img src={pagamentoIcon} alt="Pergunta" />
            </div>
            <h3>Como são processados os pagamentos?</h3>
            <p>
              Pagamento via PIX antes do evento. O cliente paga o valor total
              (seu valor + taxa). O valor é creditado na sua carteira após
              confirmação e você pode solicitar saque via PIX.
            </p>
            <p className="highlight">Segurança e agilidade</p>
          </div>

          <div className="feature-card">
            <div className="feature-icon chef-icon">
              <img src={chefIcon} alt="Pergunta" />
            </div>
            <h3>Como criar meu perfil?</h3>
            <p>
              Cadastre-se gratuitamente, complete sua bio, especialidades e
              experiência. Adicione fotos, cardápio e links das suas redes
              sociais.
            </p>
            <p className="highlight">Perfil completo atrai mais clientes</p>
          </div>

          <div className="feature-card">
            <div className="feature-icon calendar">
              <img src={cancelamentoIcon} alt="Pergunta" />
            </div>
            <h3>Posso cancelar ou rejeitar pedidos?</h3>
            <p>
              Sim, você pode rejeitar pedidos. Após aceitar, envie o orçamento.
              O cliente pode aceitar ou rejeitar seu orçamento.
            </p>
            <p className="highlight">Controle sobre seus serviços</p>
          </div>

          <div className="feature-card">
            <div className="feature-icon payment">
              <img src={dinheiroIcon} alt="Pergunta" />
            </div>
            <h3>Qual a taxa cobrada pela plataforma?</h3>
            <p>
              A taxa é de 15% do valor do serviço + R$ 0,80 fixo. O cliente paga
              o valor total e você recebe 100% do valor que cotou.
            </p>
            <p className="highlight">Taxa transparente</p>
          </div>

          <div className="feature-card">
            <div className="feature-icon chef-icon">
              <img src={avaliacaoIcon} alt="Pergunta" />
            </div>
            <h3>Como funcionam as avaliações?</h3>
            <p>
              Clientes avaliam após o serviço ser completado. As avaliações vão
              de 1 a 5 estrelas e aparecem no seu perfil público.
            </p>
            <p className="highlight">Construa sua reputação</p>
          </div>
        </div>
        <button
          onClick={scrollRight}
          className="carousel-nav-button carousel-nav-right"
        >
          ›
        </button>
      </div>
    </section>
  );
};

export default FAQ;
