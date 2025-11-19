import React, { useEffect, useState, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import "./Dashboard.css";
import "./DashboardDark.css";
import "./ProfilePage.css";
import {
  chefService,
  Cuisine,
  ChefGalleryPhoto,
  ChefSocialType,
  ChefSocialLink,
} from "../services/chef.service";
import { useAuth } from "../contexts/AuthContext";
import { authService } from "../services/auth.service";
import editIcon from "../assets/edit.svg";
import perfilVazio from "../assets/perfilvazio.png";
import { DashboardSidebar } from "../components/DashboardSidebar";

interface ChefCuisineRelation {
  id: number;
  cuisine: {
    id: number;
    title: string;
  };
}

interface UserRelation {
  id: number;
  name: string;
  profilePictureUrl?: string;
}

interface ChefProfileResponse {
  id: number;
  bio?: string;
  yearsOfExperience?: number;
  portfolioDescription?: string;
  avgRating: number;
  isAvailable: boolean;
  createdAt: Date;
  updatedAt: Date;
  user?: UserRelation;
  chefCuisines?: ChefCuisineRelation[];
  socialLinks?: Array<{
    type: string;
    url: string;
  }>;
  menuUrl?: string;
  menuOriginalName?: string;
  menuMimeType?: string;
  menuSizeBytes?: number;
}

const ProfilePage: React.FC = () => {
  const location = useLocation();
  const { user, checkAuth } = useAuth();
  const [profile, setProfile] = useState<ChefProfileResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  const [editedName, setEditedName] = useState<string>("");
  const [editedBio, setEditedBio] = useState<string>("");
  const [editedSpecialty, setEditedSpecialty] = useState<string>("");
  const [editedYearsOfExperience, setEditedYearsOfExperience] =
    useState<number>(0);
  const [editedIsAvailable, setEditedIsAvailable] = useState<boolean>(true);
  const [selectedCuisineIds, setSelectedCuisineIds] = useState<Set<number>>(
    new Set()
  );

  const [availableCuisines, setAvailableCuisines] = useState<Cuisine[]>([]);
  const [isLoadingCuisines, setIsLoadingCuisines] = useState<boolean>(false);
  const [galleryPhotos, setGalleryPhotos] = useState<ChefGalleryPhoto[]>([]);
  const [isLoadingGallery, setIsLoadingGallery] = useState<boolean>(false);
  const [isUploadingGalleryPhoto, setIsUploadingGalleryPhoto] =
    useState<boolean>(false);
  const galleryFileInputRef = useRef<HTMLInputElement>(null);
  const [socialLinks, setSocialLinks] = useState<ChefSocialLink[]>([]);
  const [newSocialType, setNewSocialType] = useState<ChefSocialType | "">("");
  const [newSocialUrl, setNewSocialUrl] = useState<string>("");
  const [isUploadingMenu, setIsUploadingMenu] = useState<boolean>(false);
  const menuFileInputRef = useRef<HTMLInputElement>(null);
  const [showMenuPreview, setShowMenuPreview] = useState<boolean>(false);
  const [isUploadingProfilePicture, setIsUploadingProfilePicture] = useState<boolean>(false);
  const profilePictureFileInputRef = useRef<HTMLInputElement>(null);
  const [theme, setTheme] = useState<"dark" | "light">(() => {
    const savedTheme = localStorage.getItem("dashboard-theme");
    return (savedTheme as "dark" | "light") || "dark";
  });

  useEffect(() => {
    const loadProfile = async () => {
      try {
        setIsLoading(true);
        setError("");
        const profileData = await chefService.getMyProfile();
        setProfile(profileData as ChefProfileResponse);

        setEditedName(user?.name || "");
        setEditedBio(profileData.bio || "");
        setEditedSpecialty(profileData.portfolioDescription || "");
        setEditedYearsOfExperience(profileData.yearsOfExperience || 0);
        setEditedIsAvailable(profileData.isAvailable ?? true);

        const cuisineIds =
          (profileData as ChefProfileResponse).chefCuisines?.map(
            (cc) => cc.cuisine.id
          ) || [];
        setSelectedCuisineIds(new Set(cuisineIds));

        const loadSocialLinks = async () => {
          try {
            const links = await chefService.getMySocialLinks();
            setSocialLinks(links);
          } catch (err) {}
        };
        loadSocialLinks();
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Erro ao carregar perfil"
        );
      } finally {
        setIsLoading(false);
      }
    };

    const loadGallery = async () => {
      try {
        setIsLoadingGallery(true);
        const photos = await chefService.getMyGallery();
        setGalleryPhotos(photos);
      } catch (err) {
      } finally {
        setIsLoadingGallery(false);
      }
    };

    if (user) {
      loadProfile();
      loadGallery();
    }
  }, [user]);

  useEffect(() => {
    const loadAvailableCuisines = async () => {
      if (isEditing) {
        try {
          setIsLoadingCuisines(true);
          const cuisines = await chefService.listCuisines(1, 100);
          setAvailableCuisines(cuisines);
        } catch (err) {
        } finally {
          setIsLoadingCuisines(false);
        }
      }
    };

    loadAvailableCuisines();
  }, [isEditing]);

  const handleEdit = async () => {
    setIsEditing(true);
    if (profile) {
      setEditedName(user?.name || "");
      setEditedBio(profile.bio || "");
      setEditedSpecialty(profile.portfolioDescription || "");
      setEditedYearsOfExperience(profile.yearsOfExperience || 0);
      setEditedIsAvailable(profile.isAvailable ?? true);
      const cuisineIds = profile.chefCuisines?.map((cc) => cc.cuisine.id) || [];
      setSelectedCuisineIds(new Set(cuisineIds));
    } else {
      setEditedName(user?.name || "");
      setEditedBio("");
      setEditedSpecialty("");
      setEditedYearsOfExperience(0);
      setEditedIsAvailable(true);
      setSelectedCuisineIds(new Set());
    }
    try {
      const links = await chefService.getMySocialLinks();
      setSocialLinks(links);
    } catch (err) {}
  };

  const handleCancel = () => {
    setIsEditing(false);
    if (profile) {
      setEditedName(user?.name || "");
      setEditedBio(profile.bio || "");
      setEditedSpecialty(profile.portfolioDescription || "");
      setEditedYearsOfExperience(profile.yearsOfExperience || 0);
      setEditedIsAvailable(profile.isAvailable ?? true);
      const cuisineIds = profile.chefCuisines?.map((cc) => cc.cuisine.id) || [];
      setSelectedCuisineIds(new Set(cuisineIds));
    }
  };

  const handleSave = async () => {
    if (!profile) return;

    try {
      setIsSaving(true);
      setError("");

      if (editedName.trim() && editedName !== user?.name) {
        await authService.updateName(editedName.trim());
        await checkAuth();
      }

      await chefService.updateMyProfile({
        bio: editedBio,
        portfolioDescription: editedSpecialty,
        yearsOfExperience: editedYearsOfExperience,
        isAvailable: editedIsAvailable,
      });

      const currentCuisineIds = new Set(
        profile.chefCuisines?.map((cc) => cc.cuisine.id) || []
      );

      for (const cuisineId of selectedCuisineIds) {
        if (!currentCuisineIds.has(cuisineId)) {
          await chefService.addCuisine(cuisineId);
        }
      }

      for (const cuisineId of currentCuisineIds) {
        if (!selectedCuisineIds.has(cuisineId)) {
          await chefService.removeCuisine(cuisineId);
        }
      }

      const updatedProfile = await chefService.getMyProfile();
      setProfile(updatedProfile as ChefProfileResponse);
      const updatedLinks = await chefService.getMySocialLinks();
      setSocialLinks(updatedLinks);
      setIsEditing(false);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Erro ao salvar alterações"
      );
    } finally {
      setIsSaving(false);
    }
  };

  const toggleCuisine = (cuisineId: number) => {
    setSelectedCuisineIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(cuisineId)) {
        newSet.delete(cuisineId);
      } else {
        newSet.add(cuisineId);
      }
      return newSet;
    });
  };

  const handleGalleryPhotoChange = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = ["image/jpeg", "image/png", "image/webp", "image/avif"];
    if (!validTypes.includes(file.type)) {
      setError("Formato de arquivo inválido. Use JPEG, PNG, WebP ou AVIF.");
      return;
    }

    if (file.size > 50 * 1024 * 1024) {
      setError("Arquivo muito grande. O tamanho máximo é 50MB.");
      return;
    }

    if (galleryPhotos.length >= 12) {
      setError("Você já atingiu o limite máximo de 12 fotos na galeria.");
      return;
    }

    try {
      setIsUploadingGalleryPhoto(true);
      setError("");
      const newPhoto = await chefService.addGalleryPhoto(file);
      setGalleryPhotos((prev) =>
        [...prev, newPhoto].sort((a, b) => a.position - b.position)
      );
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Erro ao fazer upload da foto"
      );
    } finally {
      setIsUploadingGalleryPhoto(false);
      if (galleryFileInputRef.current) {
        galleryFileInputRef.current.value = "";
      }
    }
  };

  const handleDeleteGalleryPhoto = async (photoId: number) => {
    if (!confirm("Tem certeza que deseja remover esta foto da galeria?")) {
      return;
    }

    try {
      setError("");
      await chefService.deleteGalleryPhoto(photoId);
      setGalleryPhotos((prev) => prev.filter((photo) => photo.id !== photoId));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao remover foto");
    }
  };

  const handleAddGalleryPhotoClick = () => {
    galleryFileInputRef.current?.click();
  };

  const handleProfilePictureChange = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = ["image/jpeg", "image/png", "image/webp", "image/avif"];
    if (!validTypes.includes(file.type)) {
      setError("Formato de arquivo inválido. Use JPEG, PNG, WebP ou AVIF.");
      return;
    }

    if (file.size > 50 * 1024 * 1024) {
      setError("Arquivo muito grande. O tamanho máximo é 50MB.");
      return;
    }

    try {
      setIsUploadingProfilePicture(true);
      setError("");
      await chefService.uploadProfilePicture(file);
      
      // Atualizar o contexto de autenticação
      await checkAuth();
      
      // Limpar o input
      if (profilePictureFileInputRef.current) {
        profilePictureFileInputRef.current.value = "";
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Erro ao fazer upload da foto"
      );
    } finally {
      setIsUploadingProfilePicture(false);
    }
  };

  const handleChangeProfilePictureClick = () => {
    profilePictureFileInputRef.current?.click();
  };

  const handleAddSocialLink = async () => {
    if (!newSocialType || !newSocialUrl.trim()) {
      setError("Selecione uma rede social e informe a URL");
      return;
    }

    try {
      setError("");
      await chefService.addSocialLink({
        type: newSocialType as ChefSocialType,
        url: newSocialUrl.trim(),
      });
      const updatedLinks = await chefService.getMySocialLinks();
      setSocialLinks(updatedLinks);
      setNewSocialType("");
      setNewSocialUrl("");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Erro ao adicionar rede social"
      );
    }
  };

  const handleDeleteSocialLink = async (type: ChefSocialType) => {
    if (!confirm("Tem certeza que deseja remover esta rede social?")) {
      return;
    }

    try {
      setError("");
      await chefService.deleteSocialLink(type);
      const updatedLinks = await chefService.getMySocialLinks();
      setSocialLinks(updatedLinks);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Erro ao remover rede social"
      );
    }
  };

  const getAvailableSocialTypes = (): ChefSocialType[] => {
    const allTypes: ChefSocialType[] = [
      "INSTAGRAM",
      "FACEBOOK",
      "YOUTUBE",
      "TIKTOK",
      "WHATSAPP",
    ];
    const usedTypes = new Set(socialLinks.map((link) => link.type));
    return allTypes.filter((type) => !usedTypes.has(type));
  };

  const handleMenuChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];
    if (!validTypes.includes(file.type)) {
      setError("Formato de arquivo inválido. Use PDF ou DOCX.");
      return;
    }

    const maxSize = 20 * 1024 * 1024;
    if (file.size > maxSize) {
      setError("Arquivo muito grande. O tamanho máximo é 20MB.");
      return;
    }

    try {
      setIsUploadingMenu(true);
      setError("");
      await chefService.uploadMenu(file);

      const updatedProfile = await chefService.getMyProfile();
      setProfile(updatedProfile as ChefProfileResponse);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Erro ao fazer upload do cardápio"
      );
    } finally {
      setIsUploadingMenu(false);
      if (menuFileInputRef.current) {
        menuFileInputRef.current.value = "";
      }
    }
  };

  const handleMenuButtonClick = () => {
    menuFileInputRef.current?.click();
  };

  const handleDeleteMenu = async () => {
    if (!confirm("Tem certeza que deseja remover o cardápio?")) {
      return;
    }

    try {
      setError("");
      await chefService.deleteMenu();
      const updatedProfile = await chefService.getMyProfile();
      setProfile(updatedProfile as ChefProfileResponse);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao remover cardápio");
    }
  };

  const formatFileSize = (bytes?: number): string => {
    if (!bytes) return "";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleMenuThumbnailClick = () => {
    setShowMenuPreview(true);
  };

  const handleDownloadMenu = () => {
    if (profile?.menuUrl) {
      const link = document.createElement('a');
      link.href = profile.menuUrl;
      link.download = profile.menuOriginalName || 'cardapio.pdf';
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const bio = profile?.bio || "";
  const specialty = profile?.portfolioDescription || "";
  const yearsOfExperience = profile?.yearsOfExperience || 0;
  const isAvailable = profile?.isAvailable ?? true;
  const cuisines =
    profile?.chefCuisines?.map((cc) => ({
      id: cc.cuisine.id,
      title: cc.cuisine.title,
    })) || [];

  const toggleTheme = () => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  };

  useEffect(() => {
    localStorage.setItem("dashboard-theme", theme);
  }, [theme]);

  return (
    <div className={`dashboard-layout ${theme === "light" ? "dashboard-light" : "dashboard-dark"}`}>
      <DashboardSidebar theme={theme} onThemeToggle={toggleTheme} />
      <main className={`dashboard-main ${theme === "light" ? "dashboard-light-main" : "dashboard-dark-main"}`}>
        <div className={`dashboard-content ${theme === "light" ? "dashboard-light-content" : "dashboard-dark-content"}`}>
          <div className={`dashboard-header ${theme === "light" ? "dashboard-light-header" : "dashboard-dark-header"}`}>
            <h1 className={`dashboard-title ${theme === "light" ? "dashboard-light-title" : "dashboard-dark-title"}`}>Perfil</h1>
          </div>
          <div className="profile-header">
            <div className="profile-title-section">
              {!isEditing && (
                <span
                  className={`availability-badge-header ${
                    isAvailable ? "available" : "unavailable"
                  }`}
                >
                  {isAvailable ? " Disponível" : " Indisponível"}
                </span>
              )}
            </div>
            {!isEditing ? (
              <button
                className="edit-button"
                onClick={handleEdit}
                aria-label="Editar perfil"
              >
                <img src={editIcon} alt="Editar" width="20" height="20" />
              </button>
            ) : (
              <div className="edit-actions">
                <button
                  className="cancel-button"
                  onClick={handleCancel}
                  disabled={isSaving}
                >
                  Cancelar
                </button>
                <button
                  className="save-button"
                  onClick={handleSave}
                  disabled={isSaving}
                >
                  {isSaving ? "Salvando..." : "Salvar"}
                </button>
              </div>
            )}
          </div>

          {error && <div className="profile-error">{error}</div>}

          {isLoading ? (
            <div className="profile-loading">Carregando...</div>
          ) : (
            <>
              {isEditing && (
                <div className="dashboard-dark-card profile-picture-section">
                  <h2 className="dashboard-dark-card-title">Foto de Perfil</h2>
                  <div className="profile-picture-edit-container">
                    <input
                      ref={profilePictureFileInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/avif"
                      onChange={handleProfilePictureChange}
                      style={{ display: "none" }}
                      disabled={isUploadingProfilePicture}
                    />
                    <button
                      type="button"
                      className="change-profile-picture-button"
                      onClick={handleChangeProfilePictureClick}
                      disabled={isUploadingProfilePicture}
                    >
                      {isUploadingProfilePicture ? "Enviando..." : "Alterar Foto"}
                    </button>
                  </div>
                </div>
              )}
              <div className="profile-content">
              <div className="profile-main-grid">
                <div className="profile-left-column">
                  <div className="dashboard-dark-card">
                    <h2 className="dashboard-dark-card-title">Nome</h2>
                    {isEditing ? (
                      <input
                        type="text"
                        className="profile-edit-input"
                        value={editedName}
                        onChange={(e) => setEditedName(e.target.value)}
                        placeholder="Seu nome"
                        maxLength={120}
                      />
                    ) : (
                      <p className="profile-section-text">
                        {user?.name || "Nome não informado"}
                      </p>
                    )}
                  </div>

                  <div className="dashboard-dark-card">
                    <h2 className="dashboard-dark-card-title">Biografia</h2>
                    {isEditing ? (
                      <textarea
                        className="profile-edit-textarea"
                        value={editedBio}
                        onChange={(e) => setEditedBio(e.target.value)}
                        placeholder="Escreva sua biografia..."
                        rows={4}
                      />
                    ) : (
                      <p className="profile-section-text">
                        {bio || "Nenhuma biografia cadastrada."}
                      </p>
                    )}
                  </div>

                  <div className="dashboard-dark-card">
                    <h2 className="dashboard-dark-card-title">Especialidade</h2>
                    {isEditing ? (
                      <textarea
                        className="profile-edit-textarea"
                        value={editedSpecialty}
                        onChange={(e) => setEditedSpecialty(e.target.value)}
                        placeholder="Descreva sua especialidade..."
                        rows={3}
                      />
                    ) : (
                      <p className="profile-section-text">
                        {specialty || "Nenhuma especialidade cadastrada."}
                      </p>
                    )}
                  </div>

                  <div className="dashboard-dark-card">
                    <h2 className="dashboard-dark-card-title">Categorias</h2>
                    {isEditing ? (
                      <div className="categories-edit-container">
                        {isLoadingCuisines ? (
                          <p className="profile-section-text">Carregando categorias...</p>
                        ) : (
                          <>
                            <p className="categories-hint">
                              Clique nas categorias para adicionar ou remover:
                            </p>
                            <div className="available-categories">
                              {availableCuisines.map((cuisine) => {
                                const isSelected = selectedCuisineIds.has(
                                  cuisine.id
                                );
                                return (
                                  <button
                                    key={cuisine.id}
                                    type="button"
                                    className={`category-tag ${
                                      isSelected ? "selected" : ""
                                    }`}
                                    onClick={() => toggleCuisine(cuisine.id)}
                                  >
                                    {cuisine.title}
                                    {isSelected && (
                                      <span className="category-check">✓</span>
                                    )}
                                  </button>
                                );
                              })}
                            </div>
                          </>
                        )}
                      </div>
                    ) : (
                      <div className="categories-container">
                        {cuisines.length > 0 ? (
                          cuisines.map((cuisine) => (
                            <span key={cuisine.id} className="category-tag">
                              {cuisine.title}
                            </span>
                          ))
                        ) : (
                          <p className="profile-section-text">
                            Nenhuma categoria cadastrada.
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div className="profile-right-column">
                  <div className="dashboard-dark-card">
                    <h2 className="dashboard-dark-card-title">Informações</h2>
                    <div className="profile-info-card">
                      <div className="info-item">
                        <span className="info-label">Anos de Experiência</span>
                        {isEditing ? (
                          <input
                            type="number"
                            className="profile-edit-input"
                            value={editedYearsOfExperience}
                            onChange={(e) =>
                              setEditedYearsOfExperience(parseInt(e.target.value) || 0)
                            }
                            placeholder="0"
                            min="0"
                            max="100"
                          />
                        ) : (
                          <span className="info-value">
                            {yearsOfExperience > 0
                              ? `${yearsOfExperience} ${
                                  yearsOfExperience === 1 ? "ano" : "anos"
                                } de experiência`
                              : "Não informado"}
                          </span>
                        )}
                      </div>

                      {isEditing && (
                        <div className="info-item">
                          <span className="info-label">Disponibilidade</span>
                          <div className="availability-toggle-container">
                            <label className="toggle-switch">
                              <input
                                type="checkbox"
                                checked={editedIsAvailable}
                                onChange={(e) => setEditedIsAvailable(e.target.checked)}
                              />
                              <span className="toggle-slider"></span>
                            </label>
                            <span className="availability-label">
                              {editedIsAvailable
                                ? "Disponível"
                                : "Indisponível"}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {isEditing && (
                    <div className="dashboard-dark-card">
                      <h2 className="dashboard-dark-card-title">Redes Sociais</h2>
                      <div className="social-links-edit-container">
                        {socialLinks.length > 0 && (
                          <div className="social-links-list">
                            {socialLinks.map((link) => (
                              <div key={link.type} className="social-link-item">
                                <span className="social-link-type">
                                  {link.type}
                                </span>
                                <span className="social-link-url">{link.url}</span>
                                <button
                                  type="button"
                                  className="social-link-delete"
                                  onClick={() => handleDeleteSocialLink(link.type)}
                                  aria-label="Remover rede social"
                                >
                                  <svg
                                    width="16"
                                    height="16"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    xmlns="http://www.w3.org/2000/svg"
                                  >
                                    <path
                                      d="M18 6L6 18M6 6L18 18"
                                      stroke="#f44336"
                                      strokeWidth="2"
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                    />
                                  </svg>
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                        {getAvailableSocialTypes().length > 0 && (
                          <div className="add-social-link-container">
                            <select
                              className="edit-input"
                              value={newSocialType}
                              onChange={(e) =>
                                setNewSocialType(e.target.value as ChefSocialType)
                              }
                            >
                              <option value="">Selecione uma rede social</option>
                              {getAvailableSocialTypes().map((type) => (
                                <option key={type} value={type}>
                                  {type}
                                </option>
                              ))}
                            </select>
                            <input
                              type="text"
                              className="edit-input"
                              value={newSocialUrl}
                              onChange={(e) => setNewSocialUrl(e.target.value)}
                              placeholder="URL da rede social"
                            />
                            <button
                              type="button"
                              className="add-social-button"
                              onClick={handleAddSocialLink}
                            >
                              Adicionar
                            </button>
                          </div>
                        )}
                        {getAvailableSocialTypes().length === 0 &&
                          socialLinks.length > 0 && (
                            <p className="section-text">
                              Todas as redes sociais disponíveis foram adicionadas.
                            </p>
                          )}
                      </div>
                    </div>
                  )}

                  {!isEditing && (
                    <div className="dashboard-dark-card">
                      <h2 className="dashboard-dark-card-title">Cardápio</h2>
                      <div className="menu-section">
                        <input
                          ref={menuFileInputRef}
                          type="file"
                          accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                          onChange={handleMenuChange}
                          style={{ display: "none" }}
                          disabled={isUploadingMenu}
                        />
                        <div className="menu-buttons-container">
                          <button
                            className="menu-button"
                            onClick={handleMenuButtonClick}
                            disabled={isUploadingMenu}
                          >
                            {isUploadingMenu ? "Enviando..." : "Adicionar cardápio"}
                          </button>
                          {profile?.menuUrl && (
                            <button
                              className="menu-remove-button"
                              onClick={handleDeleteMenu}
                              disabled={isUploadingMenu}
                              aria-label="Remover cardápio"
                            >
                              Remover cardápio
                            </button>
                          )}
                        </div>
                        {profile?.menuUrl && (
                          <div className="menu-info">
                            <div className="menu-thumbnail-container">
                              {(profile.menuUrl.endsWith('.pdf') || profile.menuMimeType === 'application/pdf') ? (
                                <div className="menu-pdf-thumbnail" onClick={handleMenuThumbnailClick}>
                                  <iframe
                                    src={`${profile.menuUrl}#page=1&zoom=50`}
                                    className="menu-pdf-thumbnail-iframe"
                                    title="Prévia do Cardápio"
                                    scrolling="no"
                                  />
                                  <div className="menu-thumbnail-overlay">
                                    <span className="menu-thumbnail-text">Clique para visualizar</span>
                                  </div>
                                </div>
                              ) : (
                                <button
                                  type="button"
                                  className="menu-link-button"
                                  onClick={() => window.open(profile.menuUrl, '_blank')}
                                >
                                  <span className="menu-file-name">
                                    {profile.menuOriginalName || "Cardápio"}
                                  </span>
                                  {profile.menuSizeBytes && (
                                    <span className="menu-file-size">
                                      ({formatFileSize(profile.menuSizeBytes)})
                                    </span>
                                  )}
                                </button>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {!isEditing && (
                <>
                  <div className="dashboard-dark-card">
                    <div className="add-photos-section">
                    <input
                      ref={galleryFileInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/avif"
                      onChange={handleGalleryPhotoChange}
                      style={{ display: "none" }}
                      disabled={
                        isUploadingGalleryPhoto || galleryPhotos.length >= 12
                      }
                    />
                    <button
                      className="add-photos-button"
                      aria-label="Adicionar mais fotos"
                      onClick={handleAddGalleryPhotoClick}
                      disabled={
                        isUploadingGalleryPhoto || galleryPhotos.length >= 12
                      }
                    >
                      {isUploadingGalleryPhoto ? (
                        <div className="upload-spinner-small">...</div>
                      ) : (
                        <svg
                          width="24"
                          height="24"
                          viewBox="0 0 24 24"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            d="M12 5V19M5 12H19"
                            stroke="#ff6b35"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      )}
                    </button>
                      <span className="add-photos-text">
                        {isUploadingGalleryPhoto
                          ? "Enviando..."
                          : galleryPhotos.length >= 12
                          ? "Limite de 12 fotos atingido"
                          : "Adicione mais fotos"}
                      </span>
                    </div>
                  </div>

                  <div className="dashboard-dark-card">
                    <h2 className="dashboard-dark-card-title">Galeria</h2>
                    <div className="gallery-section">
                    {isLoadingGallery ? (
                      <div className="gallery-empty">
                        <p>Carregando galeria...</p>
                      </div>
                    ) : galleryPhotos.length > 0 ? (
                      <div className="gallery-grid">
                        {galleryPhotos.map((photo) => (
                          <div key={photo.id} className="gallery-item">
                            <img
                              src={photo.url}
                              alt={photo.caption || `Foto ${photo.position}`}
                            />
                            <button
                              className="gallery-item-delete"
                              onClick={() => handleDeleteGalleryPhoto(photo.id)}
                              aria-label="Remover foto"
                              title="Remover foto"
                            >
                              <svg
                                width="20"
                                height="20"
                                viewBox="0 0 24 24"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                              >
                                <path
                                  d="M18 6L6 18M6 6L18 18"
                                  stroke="white"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                              </svg>
                            </button>
                            {photo.caption && (
                              <div className="gallery-item-caption">
                                {photo.caption}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="gallery-empty">
                        <p>Nenhuma foto adicionada ainda.</p>
                      </div>
                    )}
                    </div>
                  </div>
                </>
              )}
              </div>
            </>
          )}
        </div>
      </main>

      {showMenuPreview && profile?.menuUrl && (
        <div className="menu-preview-modal-overlay" onClick={() => setShowMenuPreview(false)}>
          <div className="menu-preview-modal" onClick={(e) => e.stopPropagation()}>
            <div className="menu-preview-modal-header">
              <h2 className="menu-preview-modal-title">
                {profile.menuOriginalName || "Cardápio"}
              </h2>
              <div className="menu-preview-modal-actions">
                <button
                  className="menu-preview-download-button"
                  onClick={handleDownloadMenu}
                  aria-label="Baixar cardápio"
                >
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  Baixar
                </button>
              </div>
            </div>
            <div className="menu-preview-modal-content">
              {(profile.menuUrl.endsWith('.pdf') || profile.menuMimeType === 'application/pdf') ? (
                <iframe
                  src={`${profile.menuUrl}#page=1`}
                  className="menu-preview-iframe"
                  title="Prévia do Cardápio"
                />
              ) : (
                <div className="menu-preview-download">
                  <p>Este arquivo não pode ser visualizado diretamente.</p>
                  <button
                    onClick={handleDownloadMenu}
                    className="menu-preview-download-link"
                  >
                    Baixar arquivo
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfilePage;
