import React, { useRef } from 'react';
import calendarioIcon from '../assets/calendario.svg';
import pagamentoIcon from '../assets/pagamento.svg';
import chefIcon from '../assets/iconecard.png';
import cancelamentoIcon from '../assets/cancelamento.svg';
import dinheiroIcon from '../assets/dinheiro.svg';
import avaliacaoIcon from '../assets/avaliacao.svg';

const FAQ: React.FC = () => {
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    const scrollLeft = () => {
        if (scrollContainerRef.current) {
            scrollContainerRef.current.scrollBy({
                left: -350,
                behavior: 'smooth'
            });
        }
    };

    const scrollRight = () => {
        if (scrollContainerRef.current) {
            scrollContainerRef.current.scrollBy({
                left: 350,
                behavior: 'smooth'
            });
        }
    };

    return (
        <section id="faqs" className="features faq-section">
            <h2 className="faq-title">Perguntas Frequentes</h2>
            <div className="faq-carousel-wrapper">
                <button onClick={scrollLeft} className="carousel-nav-button carousel-nav-left">
                    ‹
                </button>
                <div className="faq-carousel-container" ref={scrollContainerRef}>
                    <div className="feature-card">
                        <div className="feature-icon calendar">
                            <img src={calendarioIcon} alt="Pergunta" />
                        </div>
                        <h3>Como funciona o agendamento?</h3>
                        <ul>
                            <li>Os clientes podem ver sua disponibilidade em tempo real</li>
                            <li>Você recebe notificações de novos agendamentos</li>
                        </ul>
                        <p className="highlight">Gerencie todos os seus eventos em um só lugar</p>
                    </div>
                    
                    <div className="feature-card">
                        <div className="feature-icon payment">
                            <img src={pagamentoIcon} alt="Pergunta" />
                        </div>
                        <h3>Como são processados os pagamentos?</h3>
                        <ul>
                            <li>Pagamentos seguros processados antes do evento</li>
                            <li>Você recebe os valores diretamente na sua conta</li>
                        </ul>
                        <p className="highlight">Tranquilidade e segurança nas transações</p>
                    </div>
                    
                    <div className="feature-card">
                        <div className="feature-icon chef-icon">
                            <img src={chefIcon} alt="Pergunta" />
                        </div>
                        <h3>Como criar meu perfil?</h3>
                        <ul>
                            <li>Cadastre-se gratuitamente na plataforma</li>
                            <li>Adicione fotos, menus e suas especialidades</li>
                        </ul>
                        <p className="highlight">Transforme seu perfil em mais clientes</p>
                    </div>
                    
                    <div className="feature-card">
                        <div className="feature-icon calendar">
                            <img src={cancelamentoIcon} alt="Pergunta" />
                        </div>
                        <h3>Posso cancelar ou modificar agendamentos?</h3>
                        <ul>
                            <li>Sim, você pode gerenciar seus agendamentos facilmente</li>
                            <li>Notifique os clientes sobre mudanças automaticamente</li>
                        </ul>
                        <p className="highlight">Controle total sobre sua agenda</p>
                    </div>
                    
                    <div className="feature-card">
                        <div className="feature-icon payment">
                            <img src={dinheiroIcon} alt="Pergunta" />
                        </div>
                        <h3>Qual a taxa cobrada pela plataforma?</h3>
                        <ul>
                            <li>Taxas transparentes e competitivas</li>
                            <li>Consulte nossos planos na página de preços</li>
                        </ul>
                        <p className="highlight">Simplicidade e transparência nos valores</p>
                    </div>
                    
                    <div className="feature-card">
                        <div className="feature-icon chef-icon">
                            <img src={avaliacaoIcon} alt="Pergunta" />
                        </div>
                        <h3>Como recebo avaliações dos clientes?</h3>
                        <ul>
                            <li>Clientes podem avaliar após cada evento</li>
                            <li>Suas avaliações aparecem no seu perfil</li>
                        </ul>
                        <p className="highlight">Construa sua reputação na plataforma</p>
                    </div>
                </div>
                <button onClick={scrollRight} className="carousel-nav-button carousel-nav-right">
                    ›
                </button>
            </div>
        </section>
    );
};

export default FAQ;