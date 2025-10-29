import React, { useState, useEffect } from 'react';
import logoIcon from '../assets/iconebranco.png';
import './LoginModal.css';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSwitchToRegister: () => void;
}

const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose, onSwitchToRegister }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Login:', { email, password });
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container login-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-content">
          <div className="logo-container">
            <img src={logoIcon} alt="ChefNow Logo" className="logo-image" />
          </div>

          <h2 className="modal-title">Bem vindo de volta</h2>

          <form onSubmit={handleSubmit} className="login-form">
            <div className="input-group">
              <input
                type="email"
                placeholder="Email:"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="form-input"
                required
              />
            </div>

            <div className="input-group">
              <input
                type="password"
                placeholder="Senha:"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="form-input"
                required
              />
            </div>

            <button type="submit" className="login-button">
              Entrar
            </button>
          </form>

          <a href="#" className="forgot-password">
            Esqueceu a senha?
          </a>

          <button onClick={onSwitchToRegister} className="register-link">
            Cadastre-se
          </button>
        </div>
      </div>
    </div>
  );
};

export default LoginModal;