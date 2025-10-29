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

    return (
        <>
            <header className="header">
                <div className="header-logo">ChefNow</div>
                <div className="header-right">
                    <nav className="nav-links">
                        <a href="#como-funciona">Como Funciona</a>
                        <div className="nav-divider"></div>
                        <a href="#planos">Planos</a>
                        <div className="nav-divider"></div>
                        <a href="#faqs">FAQs</a>
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
