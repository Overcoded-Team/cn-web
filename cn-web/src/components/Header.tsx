import React, { useState } from 'react';
import LoginModal from './LoginModal.tsx';
import RegisterModal from './RegisterModal.tsx';

const Header: React.FC = () => {
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

    return (
        <>
            <header className="header">
                <div className="header-logo">ChefNow</div>
                <div className="header-right">
                    <nav className="nav-links">
                        <a href="#como-funciona" onClick={(e) => { e.preventDefault(); scrollToSection('como-funciona'); }}>Como Funciona</a>
                        <div className="nav-divider"></div>
                        <a href="#faqs" onClick={(e) => { e.preventDefault(); scrollToSection('faqs'); }}>FAQs</a>
                        <div className="nav-divider"></div>
                        <a href="#contatos" onClick={(e) => { e.preventDefault(); scrollToSection('contacts'); }}>Contatos</a>
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
