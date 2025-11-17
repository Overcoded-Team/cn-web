import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import LoginModal from './LoginModal.tsx';
import RegisterModal from './RegisterModal.tsx';
import './Header.css';

const Header: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
    const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);

    const handleLoginClick = () => {
        setIsLoginModalOpen(true);
    };

    const handleRegisterClick = () => {
        setIsRegisterModalOpen(true);
    };

    const handleCloseLoginModal = () => {
        setIsLoginModalOpen(false);
    };

    const handleCloseRegisterModal = () => {
        setIsRegisterModalOpen(false);
    };

    const handleSwitchToLogin = () => {
        setIsRegisterModalOpen(false);
        setIsLoginModalOpen(true);
    };

    const handleSwitchToRegister = () => {
        setIsLoginModalOpen(false);
        setIsRegisterModalOpen(true);
    };

    const scrollToSection = (sectionId: string) => {
        const element = document.getElementById(sectionId);
        if (element) {
            element.scrollIntoView({ 
                behavior: 'smooth',
                block: 'start'
            });
        }
    };

    const handleChefsClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
        e.preventDefault();
        navigate('/chefs');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleHomeSectionClick = (e: React.MouseEvent<HTMLAnchorElement>, sectionId: string) => {
        e.preventDefault();
        if (location.pathname === '/') {
            scrollToSection(sectionId);
        } else {
            navigate('/');
            setTimeout(() => {
                scrollToSection(sectionId);
            }, 100);
        }
    };

    return (
        <>
            <header className="header">
                <div className="header-logo">ChefNow</div>
                <div className="header-right">
                    <nav className="nav-links">
                        <a href="#como-funciona" onClick={(e) => handleHomeSectionClick(e, 'como-funciona')}>Como Funciona</a>
                        <div className="nav-divider"></div>
                        <a href="/chefs" onClick={handleChefsClick}>Chefs</a>
                        <div className="nav-divider"></div>
                        <a href="#faqs" onClick={(e) => handleHomeSectionClick(e, 'faqs')}>FAQs</a>
                        <div className="nav-divider"></div>
                        <a href="#contatos" onClick={(e) => handleHomeSectionClick(e, 'contacts')}>Contatos</a>
                    </nav>
                    <div className="header-buttons">
                        <button onClick={handleLoginClick} className="btn-entrar">Entrar</button>
                        <button onClick={handleRegisterClick} className="btn-cadastrar">Cadastre-se</button>
                    </div>
                </div>
            </header>
            
            <LoginModal 
                isOpen={isLoginModalOpen} 
                onClose={handleCloseLoginModal}
                onSwitchToRegister={handleSwitchToRegister}
            />
            
            <RegisterModal 
                isOpen={isRegisterModalOpen} 
                onClose={handleCloseRegisterModal}
                onSwitchToLogin={handleSwitchToLogin}
            />
        </>
    );
};

export default Header;
