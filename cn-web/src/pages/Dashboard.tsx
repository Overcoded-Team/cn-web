import React from 'react';
import './Dashboard.css';
import estrelaInteira from '../assets/estrelainteira.png';
import meiaEstrela from '../assets/meiaestrela.png';
import estrelaVazia from '../assets/estrelavazia.png';
import { DashboardSidebar } from '../components/DashboardSidebar';

const Dashboard: React.FC = () => {
    const chefData = {
        ganhos: 0.00,
        periodo: '27 de out. - 3 de nov.',
        avaliacaoMedia: 3.5,
        totalAvaliacoes: 24,
        estatisticas: {
            verde: 74,
            laranja: 19,
            vermelho: 7
        },
        ganhosGrafico: 7482.08,
        detalhamento: {
            totalEventos: 49,
            concluidos: 44,
            cancelados: 5,
            ano: 2025
        },
        progresso: {
            atendidos: 92,
            proximos: 8,
            cancelados: 5
        }
    };

    return (
        <div className="dashboard-layout">
            <DashboardSidebar />

            <main className="dashboard-main">
                <div className="main-content">
                    <h1 className="dashboard-title">Dashboard</h1>

                    <div className="dashboard-layout-grid">
                        <div className="dashboard-left-column">
                            <div className="cards-row-top">
                        <div className="card ganhos-card">
                            <h3 className="card-title-white">Ganhos</h3>
                            <p className="card-period">{chefData.periodo}</p>
                            <p className="card-value-white">R$ {chefData.ganhos.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                            <a href="#" className="card-link-white">Mais Informações</a>
                        </div>

                                <div className="card avaliacao-card">
                                    <h3 className="card-title-orange">Avaliação Média</h3>
                                    <div className="avaliacao-content">
                                        <span className="avaliacao-number">{chefData.avaliacaoMedia.toLocaleString('pt-BR', { minimumFractionDigits: 1 })}</span>
                                        <div className="stars-rating">
                                            {[...Array(5)].map((_, index) => {
                                                const starValue = index + 1;
                                                if (starValue <= Math.floor(chefData.avaliacaoMedia)) {
                                                    return (
                                                        <img 
                                                            key={index} 
                                                            src={estrelaInteira} 
                                                            alt="Estrela completa" 
                                                            className="star-image"
                                                        />
                                                    );
                                                } else if (starValue === Math.ceil(chefData.avaliacaoMedia) && chefData.avaliacaoMedia % 1 !== 0) {
                                                    return (
                                                        <img 
                                                            key={index} 
                                                            src={meiaEstrela} 
                                                            alt="Meia estrela" 
                                                            className="star-image"
                                                        />
                                                    );
                                                } else {
                                                    return (
                                                        <img 
                                                            key={index} 
                                                            src={estrelaVazia} 
                                                            alt="Estrela vazia" 
                                                            className="star-image"
                                                        />
                                                    );
                                                }
                                            })}
                                            <span className="total-avaliacoes">({chefData.totalAvaliacoes})</span>
                                        </div>
                                    </div>
                                </div>
                    </div>

                            <div className="card bar-chart-card">
                                <div className="bar-chart-header">
                                    <button className="chart-nav-btn">‹</button>
                                    <h2 className="bar-chart-title">R$ {chefData.ganhosGrafico.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h2>
                                    <button className="chart-nav-btn">›</button>
                                </div>
                                <div className="bar-chart-container">
                                    {['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'].map((mes) => {
                                        const height = 20 + Math.random() * 80;
                                        return (
                                            <div key={mes} className="bar-item">
                                                <div 
                                                    className="bar" 
                                                    style={{ height: `${height}%` }}
                                                ></div>
                                                <span className="bar-label">{mes}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            <div className="card detalhamento-card">
                                <h3 className="card-title-orange">Detalhamento</h3>
                                <div className="detalhamento-content">
                                    <div className="detalhamento-list">
                                        <p className="detalhamento-item">Total de Eventos : {chefData.detalhamento.totalEventos}</p>
                                        <p className="detalhamento-item">Concluídos: {chefData.detalhamento.concluidos}</p>
                                        <p className="detalhamento-item cancelados">Cancelados: {chefData.detalhamento.cancelados}</p>
                                    </div>
                                    <div className="detalhamento-ano">{chefData.detalhamento.ano}</div>
                                </div>
                            </div>
                        </div>

                        <div className="dashboard-right-column">
                            <div className="card estatisticas-card">
                                <h3 className="card-title-dark">Estatísticas</h3>
                                <div className="estatisticas-content-wrapper">
                                    <div className="estatisticas-chart-and-labels">
                                        <div className="donut-chart-container">
                                            {(() => {
                                                const circumference = 2 * Math.PI * 50; 
                                                const verde = (chefData.estatisticas.verde / 100) * circumference;
                                                const laranja = (chefData.estatisticas.laranja / 100) * circumference;
                                                const vermelho = (chefData.estatisticas.vermelho / 100) * circumference;
                                                
                                                return (
                                                    <svg className="donut-chart" viewBox="0 0 120 120">
                                                        <circle
                                                            className="donut-ring"
                                                            cx="60"
                                                            cy="60"
                                                            r="50"
                                                            fill="none"
                                                            stroke="#E5E5E5"
                                                            strokeWidth="20"
                                                        />
                                                        <circle
                                                            className="donut-segment donut-segment-green"
                                                            cx="60"
                                                            cy="60"
                                                            r="50"
                                                            fill="none"
                                                            stroke="#4CAF50"
                                                            strokeWidth="20"
                                                            strokeDasharray={`${verde} ${circumference}`}
                                                            strokeDashoffset={circumference - verde}
                                                            transform="rotate(-90 60 60)"
                                                        />
                                                        <circle
                                                            className="donut-segment donut-segment-orange"
                                                            cx="60"
                                                            cy="60"
                                                            r="50"
                                                            fill="none"
                                                            stroke="#FF6B35"
                                                            strokeWidth="20"
                                                            strokeDasharray={`${laranja} ${circumference}`}
                                                            strokeDashoffset={circumference - verde - laranja}
                                                            transform="rotate(-90 60 60)"
                                                        />
                                                        <circle
                                                            className="donut-segment donut-segment-red"
                                                            cx="60"
                                                            cy="60"
                                                            r="50"
                                                            fill="none"
                                                            stroke="#F44336"
                                                            strokeWidth="20"
                                                            strokeDasharray={`${vermelho} ${circumference}`}
                                                            strokeDashoffset={circumference - verde - laranja - vermelho}
                                                            transform="rotate(-90 60 60)"
                                                        />
                                                    </svg>
                                                );
                                            })()}
                                        </div>
                                        <div className="donut-labels">
                                            <div className="donut-label-item green">
                                                <span className="donut-label-value">{chefData.estatisticas.verde}%</span>
                                                <span className="donut-label-arrow">↑</span>
                                            </div>
                                            <div className="donut-label-item orange">
                                                <span className="donut-label-value">{chefData.estatisticas.laranja}%</span>
                                                <span className="donut-label-arrow">↓</span>
                                            </div>
                                            <div className="donut-label-item red">
                                                <span className="donut-label-value">{chefData.estatisticas.vermelho}%</span>
                                                <span className="donut-label-arrow">↓</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="estatisticas-progress-container">
                                        <div className="estatistica-progress-item">
                                            <h4 className="progress-title">Atendidos</h4>
                                            <div className="progress-bar-container">
                                                <div 
                                                    className="progress-bar progress-bar-green" 
                                                    style={{ width: `${chefData.progresso.atendidos}%` }}
                                                ></div>
                                            </div>
                                        </div>
                                        <div className="estatistica-progress-item">
                                            <h4 className="progress-title">Próximos</h4>
                                            <div className="progress-bar-container">
                                                <div 
                                                    className="progress-bar progress-bar-orange" 
                                                    style={{ width: `${chefData.progresso.proximos}%` }}
                                                ></div>
                                            </div>
                                        </div>
                                        <div className="estatistica-progress-item">
                                            <h4 className="progress-title">Cancelados</h4>
                                            <div className="progress-bar-container">
                                                <div 
                                                    className="progress-bar progress-bar-red" 
                                                    style={{ width: `${chefData.progresso.cancelados}%` }}
                                                ></div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default Dashboard;