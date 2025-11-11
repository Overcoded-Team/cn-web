import React, { useState, useEffect } from 'react';
import logoIcon from '../assets/iconebranco.png';
import './LoginModal.css';
import { useAuth } from '../contexts/AuthContext';

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
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { register } = useAuth();

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      setError('');
      setFormData({
        nome: '',
        cpfCnpj: '',
        email: '',
        senha: '',
        confirmarSenha: '',
        sobreVoce: ''
      });
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (formData.senha !== formData.confirmarSenha) {
        throw new Error('As senhas não coincidem');
      }

      if (formData.senha.length < 7) {
        throw new Error('A senha deve ter pelo menos 7 caracteres');
      }

      await register({
        name: formData.nome,
        document: formData.cpfCnpj,
        email: formData.email,
        password: formData.senha,
        confirmPassword: formData.confirmarSenha,
        bio: formData.sobreVoce || undefined,
      });

      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar conta. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
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

          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

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
                  disabled={isLoading}
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
                  disabled={isLoading}
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
                disabled={isLoading}
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
                  disabled={isLoading}
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
                  disabled={isLoading}
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
                disabled={isLoading}
              />
            </div>

            <button type="submit" className="login-button" disabled={isLoading}>
              {isLoading ? "Cadastrando..." : "Cadastrar"}
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