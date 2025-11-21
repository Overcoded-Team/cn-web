import React, { useState, useEffect } from "react";
import logoIcon from "../assets/iconebranco.png";
import "./LoginModal.css";
import { useAuth } from "../contexts/AuthContext";

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSwitchToRegister: () => void;
}

const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  onClose,
  onSwitchToRegister,
}) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      setError("");
      const savedEmail = localStorage.getItem("login_form_email");
      const savedPassword = localStorage.getItem("login_form_password");
      if (savedEmail) setEmail(savedEmail);
      if (savedPassword) setPassword(savedPassword);
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  const handleEmailBlur = () => {
    if (email) {
      localStorage.setItem("login_form_email", email);
    }
  };

  const handlePasswordBlur = () => {
    if (password) {
      localStorage.setItem("login_form_password", password);
    }
  };

  useEffect(() => {
    const handleBeforeUnload = () => {
      localStorage.removeItem("login_form_email");
      localStorage.removeItem("login_form_password");
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      await login(email, password);
      localStorage.removeItem("login_form_email");
      localStorage.removeItem("login_form_password");
      onClose();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Erro ao fazer login. Verifique suas credenciais."
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-container login-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-content">
          <div className="logo-container">
            <img src={logoIcon} alt="ChefNow Logo" className="logo-image" />
          </div>

          <h2 className="modal-title">Bem vindo de volta</h2>

          {error && <div className="error-message">{error}</div>}

          <form onSubmit={handleSubmit} className="login-form">
            <div className="input-group">
              <input
                type="email"
                placeholder="Email:"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onBlur={handleEmailBlur}
                className="form-input"
                required
                disabled={isLoading}
              />
            </div>

            <div className="input-group">
              <input
                type="password"
                placeholder="Senha:"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onBlur={handlePasswordBlur}
                className="form-input"
                required
                disabled={isLoading}
              />
            </div>

            <button type="submit" className="login-button" disabled={isLoading}>
              {isLoading ? "Entrando..." : "Entrar"}
            </button>
          </form>

          <button type="button" className="forgot-password">
            Esqueceu a senha?
          </button>

          <button onClick={onSwitchToRegister} className="register-link">
            Cadastre-se
          </button>
        </div>
      </div>
    </div>
  );
};

export default LoginModal;
