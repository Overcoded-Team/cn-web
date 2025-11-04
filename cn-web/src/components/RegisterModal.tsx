import React, { useState, useEffect } from 'react';
import logoIcon from '../assets/iconebranco.png';
import './LoginModal.css';

interface RegisterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSwitchToLogin: () => void;
}

const RegisterModal: React.FC<RegisterModalProps> = ({ isOpen, onClose, onSwitchToLogin }) => {
  const [formData, setFormData] = useState({
    nome: '',
    cpfCnpj: '',
    email: '',
    senha: '',
    confirmarSenha: '',
    sobreVoce: ''
  });

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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Cadastro:', formData);
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container register-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-content">
          <div className="logo-container">
            <img src={logoIcon} alt="ChefNow Logo" className="logo-image" />
          </div>

          <h2 className="modal-title">Faça seu cadastro</h2>

          <form onSubmit={handleSubmit} className="login-form">
            <div className="form-row">
              <div className="input-group">
                <input
                  type="text"
                  name="nome"
                  placeholder="Nome:"
                  value={formData.nome}
                  onChange={handleInputChange}
                  className="form-input"
                  required
                />
              </div>

              <div className="input-group">
                <input
                  type="text"
                  name="cpfCnpj"
                  placeholder="CPF/CNPJ:"
                  value={formData.cpfCnpj}
                  onChange={handleInputChange}
                  className="form-input"
                  required
                />
              </div>
            </div>

            <div className="input-group">
              <input
                type="email"
                name="email"
                placeholder="Email:"
                value={formData.email}
                onChange={handleInputChange}
                className="form-input"
                required
              />
            </div>

            <div className="form-row">
              <div className="input-group">
                <input
                  type="password"
                  name="senha"
                  placeholder="Senha:"
                  value={formData.senha}
                  onChange={handleInputChange}
                  className="form-input"
                  required
                />
              </div>

              <div className="input-group">
                <input
                  type="password"
                  name="confirmarSenha"
                  placeholder="Confirmar senha:"
                  value={formData.confirmarSenha}
                  onChange={handleInputChange}
                  className="form-input"
                  required
                />
              </div>
            </div>

            <div className="input-group">
              <textarea
                name="sobreVoce"
                placeholder="Conte-nos um pouco sobre você, suas experiências, pratos que costuma fazer"
                value={formData.sobreVoce}
                onChange={handleInputChange}
                className="form-input"
                rows={4}
                required
              />
            </div>

            <button type="submit" className="login-button">
              Cadastrar
            </button>
          </form>

          <button type="button" onClick={onSwitchToLogin} className="login-text-link">
            Login
          </button>
        </div>
      </div>
    </div>
  );
};

export default RegisterModal;