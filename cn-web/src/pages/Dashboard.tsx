import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import './Dashboard.css';
import perfilVazio from '../assets/perfilvazio.png';
import estrelaInteira from '../assets/estrelainteira.png';
import meiaEstrela from '../assets/meiaestrela.png';
import estrelaVazia from '../assets/estrelavazia.png';

const Dashboard: React.FC = () => {
    const location = useLocation();
    
    const chefData = {
        nome: 'Emily Costa',
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
            <aside className="dashboard-sidebar">
                <div className="sidebar-content">
                    <div className="chef-profile">
                        <div className="profile-photo">
                            <img 
                                src={perfilVazio} 
                                alt="Chef Emily Costa" 
                                className="chef-avatar"
                            />
                        </div>
                        <div className="chef-info">
                            <p className="chef-label">Chef</p>
                            <p className="chef-name">{chefData.nome}</p>
                        </div>
                        <div className="social-media-icons">
                            <a href="#" className="social-icon" aria-label="Facebook">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                                </svg>
                            </a>
                            <a href="#" className="social-icon" aria-label="Instagram">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                                </svg>
                            </a>
                            <a href="#" className="social-icon" aria-label="X (Twitter)">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                                </svg>
                            </a>
                        </div>
                    </div>
                    
                    <nav className="sidebar-nav">
                        <Link to="/dashboard" className={`nav-item ${location.pathname === '/dashboard' || location.pathname === '/' ? 'active' : ''}`}>Dashboard</Link>
                        <a href="#" className="nav-item">Perfil</a>
                        <a href="#" className="nav-item">Agendamentos</a>
                        <Link to="/historico" className={`nav-item ${location.pathname === '/historico' ? 'active' : ''}`}>Histórico</Link>
                    </nav>
                </div>
            </aside>

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