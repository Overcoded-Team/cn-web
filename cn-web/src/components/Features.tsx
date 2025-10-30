import React from 'react';
import calendarioIcon from '../assets/calendario.svg';
import pagamentoIcon from '../assets/pagamento.svg';
import chefIcon from '../assets/iconecard.png';

const Features: React.FC = () => {
    return (
        <section id="como-funciona" className="features">
            <div className="features-container">
                <div className="feature-card">
                    <div className="feature-icon calendar">
                        <img src={calendarioIcon} alt="Calendário" />
                    </div>
                    <h3>Agendamento adaptável</h3>
                    <ul>
                        <li>Agende seus compromissos direto com os clientes</li>
                        <li>Disponibilidade em tempo real.</li>
                    </ul>
                    <p className="highlight">Você foca na cozinha, a plataforma cuida da gestão.</p>
                </div>
                
                <div className="feature-card">
                    <div className="feature-icon payment">
                        <img src={pagamentoIcon} alt="Pagamento" />
                    </div>
                    <h3>Pagamento Seguro</h3>
                    <ul>
                        <li>O cliente acerta tudo pelo app antes do evento.</li>
                        <li>Gestão completa dos seus ganhos no seu painel.</li>
                    </ul>
                    <p className="highlight">Você foca na cozinha, a plataforma cuida das contas.</p>
                </div>
                
                <div className="feature-card">
                    <div className="feature-icon chef-icon">
                        <img src={chefIcon} alt="Chef" />
                    </div>
                    <h3>Perfil Profissional</h3>
                    <ul>
                        <li>Edição completa de Perfil e portfólio</li>
                        <li>Exiba seus melhores menus</li>
                    </ul>
                    <p className="highlight">Converta em muitas visualizações e reservas</p>
                </div>
            </div>
        </section>
    );
};

export default Features;
