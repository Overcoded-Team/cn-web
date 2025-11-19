import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import logoIcon from "../assets/iconebranco.png";
import perfilVazio from "../assets/perfilvazio.png";
import "./LoginModal.css";
import { useAuth } from "../contexts/AuthContext";
import { chefService, Cuisine } from "../services/chef.service";
import { authService } from "../services/auth.service";

interface RegisterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSwitchToLogin: () => void;
}

const RegisterModal: React.FC<RegisterModalProps> = ({
  isOpen,
  onClose,
  onSwitchToLogin,
}) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    nome: "",
    cpfCnpj: "",
    email: "",
    senha: "",
    confirmarSenha: "",
    sobreVoce: "",
  });
  const [step2Data, setStep2Data] = useState({
    profilePicture: null as File | null,
    anosExperiencia: "",
    especialidades: [] as number[],
    portfolioDescription: "",
  });
  const [availableCuisines, setAvailableCuisines] = useState<Cuisine[]>([]);
  const [isLoadingCuisines, setIsLoadingCuisines] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isUploadingPicture, setIsUploadingPicture] = useState(false);
  const [profilePicturePreview, setProfilePicturePreview] = useState<
    string | null
  >(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { checkAuth } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      setError("");
      // Carregar dados salvos do localStorage
      const savedFormData = localStorage.getItem("register_form_data");
      const savedStep2Data = localStorage.getItem("register_step2_data");
      const savedStep = localStorage.getItem("register_current_step");
      
      if (savedFormData) {
        try {
          const parsed = JSON.parse(savedFormData);
          setFormData(parsed);
        } catch (e) {
          console.error("Erro ao carregar dados do formulário:", e);
        }
      } else {
        setFormData({
          nome: "",
          cpfCnpj: "",
          email: "",
          senha: "",
          confirmarSenha: "",
          sobreVoce: "",
        });
      }

      if (savedStep2Data) {
        try {
          const parsed = JSON.parse(savedStep2Data);
          setStep2Data({
            ...parsed,
            profilePicture: null, // Não salvar arquivo, apenas dados
          });
        } catch (e) {
          console.error("Erro ao carregar dados do step 2:", e);
        }
      } else {
        setStep2Data({
          profilePicture: null,
          anosExperiencia: "",
          especialidades: [],
          portfolioDescription: "",
        });
      }

      if (savedStep) {
        setCurrentStep(parseInt(savedStep, 10));
      } else {
        setCurrentStep(1);
      }

      setProfilePicturePreview(null);
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  // Salvar formData no localStorage quando mudar
  useEffect(() => {
    if (isOpen && formData.nome) {
      localStorage.setItem("register_form_data", JSON.stringify(formData));
    }
  }, [formData, isOpen]);

  // Salvar step2Data no localStorage quando mudar (exceto profilePicture)
  useEffect(() => {
    if (isOpen && (step2Data.anosExperiencia || step2Data.especialidades.length > 0 || step2Data.portfolioDescription)) {
      const dataToSave = {
        anosExperiencia: step2Data.anosExperiencia,
        especialidades: step2Data.especialidades,
        portfolioDescription: step2Data.portfolioDescription,
      };
      localStorage.setItem("register_step2_data", JSON.stringify(dataToSave));
    }
  }, [step2Data.anosExperiencia, step2Data.especialidades, step2Data.portfolioDescription, isOpen]);

  // Salvar step atual
  useEffect(() => {
    if (isOpen) {
      localStorage.setItem("register_current_step", currentStep.toString());
    }
  }, [currentStep, isOpen]);

  // Limpar localStorage quando a página for atualizada
  useEffect(() => {
    const handleBeforeUnload = () => {
      localStorage.removeItem("register_form_data");
      localStorage.removeItem("register_step2_data");
      localStorage.removeItem("register_current_step");
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, []);

  useEffect(() => {
    const loadCuisines = async () => {
      if (currentStep === 2) {
        try {
          setIsLoadingCuisines(true);
          const cuisines = await chefService.listCuisines(1, 100);
          setAvailableCuisines(cuisines);
        } catch (err) {
          console.error("Erro ao carregar especialidades:", err);
        } finally {
          setIsLoadingCuisines(false);
        }
      }
    };
    loadCuisines();
  }, [currentStep]);

  useEffect(() => {
    if (step2Data.profilePicture) {
      const objectUrl = URL.createObjectURL(step2Data.profilePicture);
      setProfilePicturePreview(objectUrl);
      return () => {
        URL.revokeObjectURL(objectUrl);
      };
    } else {
      setProfilePicturePreview(null);
    }
  }, [step2Data.profilePicture]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleStep1Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      if (formData.senha !== formData.confirmarSenha) {
        throw new Error("As senhas não coincidem");
      }

      if (formData.senha.length < 7) {
        throw new Error("A senha deve ter pelo menos 7 caracteres");
      }

      setCurrentStep(2);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Erro ao validar dados. Tente novamente."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleStep2Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      if (!step2Data.profilePicture) {
        throw new Error("A foto de perfil é obrigatória");
      }

      if (step2Data.especialidades.length === 0) {
        throw new Error("Selecione pelo menos uma especialidade");
      }

      const documentType: "CPF" | "CNPJ" | "ID_ESTRANGEIRO" =
        formData.cpfCnpj.replace(/\D/g, "").length === 11
          ? "CPF"
          : formData.cpfCnpj.replace(/\D/g, "").length === 14
          ? "CNPJ"
          : "ID_ESTRANGEIRO";

      const registerData = {
        name: formData.nome,
        document: formData.cpfCnpj.replace(/\D/g, ""),
        documentType,
        email: formData.email,
        passwordHash: formData.senha,
        role: "CHEF" as const,
        chefProfile: {
          bio: formData.sobreVoce || "",
          yearsOfExperience: step2Data.anosExperiencia
            ? parseInt(step2Data.anosExperiencia)
            : undefined,
          portfolioDescription: step2Data.portfolioDescription || undefined,
        },
      };

      await authService.register(registerData);

      const loginResponse = await authService.login({
        email: formData.email,
        password: formData.senha,
      });
      authService.setToken(loginResponse.access_token);

      const userData = await authService.getProfile();
      if (userData.role !== "CHEF") {
        authService.logout();
        throw new Error("Apenas chefs podem acessar a plataforma");
      }
      authService.setUser(userData);

      await checkAuth();

      setIsUploadingPicture(true);
      try {
        await chefService.uploadProfilePicture(step2Data.profilePicture);
      } catch (err) {
        console.error("Erro ao fazer upload da foto:", err);
        throw new Error(
          "Erro ao fazer upload da foto de perfil. Tente novamente."
        );
      } finally {
        setIsUploadingPicture(false);
      }

      for (const cuisineId of step2Data.especialidades) {
        try {
          await chefService.addCuisine(cuisineId);
        } catch (err) {
          console.error(`Erro ao adicionar especialidade ${cuisineId}:`, err);
        }
      }

      const updatedUserData = await authService.getProfile();
      authService.setUser(updatedUserData);
      await checkAuth();

      // Limpar localStorage após cadastro bem-sucedido
      localStorage.removeItem("register_form_data");
      localStorage.removeItem("register_step2_data");
      localStorage.removeItem("register_current_step");

      onClose();
      navigate("/dashboard");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Erro ao finalizar cadastro. Tente novamente."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handlePictureChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setStep2Data((prev) => ({ ...prev, profilePicture: file }));
    }
  };

  const toggleCuisine = (cuisineId: number) => {
    setStep2Data((prev) => {
      const newEspecialidades = prev.especialidades.includes(cuisineId)
        ? prev.especialidades.filter((id) => id !== cuisineId)
        : [...prev.especialidades, cuisineId];
      return { ...prev, especialidades: newEspecialidades };
    });
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-container register-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-content">
          {currentStep === 1 && (
            <div className="logo-container">
              <img src={logoIcon} alt="ChefNow Logo" className="logo-image" />
            </div>
          )}

          <h2 className="modal-title">
            {currentStep === 1 ? "Faça seu cadastro" : "Complete seu perfil"}
          </h2>

          {currentStep === 2 && (
            <div className="step-indicator">
              <span className="step-number">Etapa 2 de 2</span>
              <p className="step-description">Adicione mais informações</p>
            </div>
          )}

          {error && <div className="error-message">{error}</div>}

          {currentStep === 1 ? (
            <form onSubmit={handleStep1Submit} className="login-form">
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

              <button
                type="submit"
                className="login-button"
                disabled={isLoading}
              >
                {isLoading ? "Cadastrando..." : "Próximo"}
              </button>
            </form>
          ) : (
            <form onSubmit={handleStep2Submit} className="login-form">
              <div className="input-group">
                <div className="profile-picture-upload">
                  <div className="profile-picture-preview">
                    <img
                      src={profilePicturePreview || perfilVazio}
                      alt="Preview"
                      className="profile-preview-image"
                    />
                    {isUploadingPicture && (
                      <div className="upload-overlay">
                        <div className="upload-spinner">...</div>
                      </div>
                    )}
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handlePictureChange}
                    style={{ display: "none" }}
                    disabled={isLoading || isUploadingPicture}
                  />
                  <button
                    type="button"
                    className="upload-picture-button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isLoading || isUploadingPicture}
                  >
                    {step2Data.profilePicture
                      ? "Alterar Foto"
                      : "Adicionar Foto"}{" "}
                    <span className="required-field">*</span>
                  </button>
                </div>
              </div>

              <div className="input-group">
                <input
                  type="number"
                  name="anosExperiencia"
                  placeholder="Anos de experiência (Opcional)"
                  value={step2Data.anosExperiencia}
                  onChange={(e) =>
                    setStep2Data((prev) => ({
                      ...prev,
                      anosExperiencia: e.target.value,
                    }))
                  }
                  className="form-input"
                  min="0"
                  disabled={isLoading}
                />
              </div>

              <div className="input-group">
                <label className="form-label">
                  Especialidades <span className="required-field">*</span>{" "}
                  (Selecione pelo menos uma)
                </label>
                {isLoadingCuisines ? (
                  <p style={{ color: "white", textAlign: "center" }}>
                    Carregando especialidades...
                  </p>
                ) : (
                  <div className="cuisines-grid">
                    {availableCuisines.map((cuisine) => (
                      <button
                        key={cuisine.id}
                        type="button"
                        className={`cuisine-chip ${
                          step2Data.especialidades.includes(cuisine.id)
                            ? "selected"
                            : ""
                        }`}
                        onClick={() => toggleCuisine(cuisine.id)}
                        disabled={isLoading}
                      >
                        {cuisine.title}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="input-group">
                <textarea
                  name="portfolioDescription"
                  placeholder="Descrição do seu portfólio (Opcional)"
                  value={step2Data.portfolioDescription}
                  onChange={(e) =>
                    setStep2Data((prev) => ({
                      ...prev,
                      portfolioDescription: e.target.value,
                    }))
                  }
                  className="form-input"
                  rows={4}
                  disabled={isLoading}
                />
              </div>

              <div className="step2-buttons">
                <button
                  type="submit"
                  className="login-button"
                  disabled={
                    isLoading ||
                    isUploadingPicture ||
                    !step2Data.profilePicture ||
                    step2Data.especialidades.length === 0
                  }
                >
                  {isLoading ? "Salvando..." : "Finalizar"}
                </button>
              </div>
            </form>
          )}

          {currentStep === 1 && (
            <button
              type="button"
              onClick={onSwitchToLogin}
              className="login-text-link"
            >
              Login
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default RegisterModal;
