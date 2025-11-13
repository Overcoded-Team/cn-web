import React, { useEffect, useState, useRef } from 'react';
import './Dashboard.css';
import './ProfilePage.css';
import { DashboardSidebar } from '../components/DashboardSidebar';
import { chefService, Cuisine, ChefGalleryPhoto } from '../services/chef.service';
import { useAuth } from '../contexts/AuthContext';

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
}

const ProfilePage: React.FC = () => {
  const { user, checkAuth } = useAuth();
  const [profile, setProfile] = useState<ChefProfileResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  
  const [editedBio, setEditedBio] = useState<string>('');
  const [editedSpecialty, setEditedSpecialty] = useState<string>('');
  const [editedYearsOfExperience, setEditedYearsOfExperience] = useState<number>(0);
  const [editedIsAvailable, setEditedIsAvailable] = useState<boolean>(true);
  const [selectedCuisineIds, setSelectedCuisineIds] = useState<Set<number>>(new Set());
  
  const [availableCuisines, setAvailableCuisines] = useState<Cuisine[]>([]);
  const [isLoadingCuisines, setIsLoadingCuisines] = useState<boolean>(false);
  const [isUploadingPicture, setIsUploadingPicture] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [galleryPhotos, setGalleryPhotos] = useState<ChefGalleryPhoto[]>([]);
  const [isLoadingGallery, setIsLoadingGallery] = useState<boolean>(false);
  const [isUploadingGalleryPhoto, setIsUploadingGalleryPhoto] = useState<boolean>(false);
  const galleryFileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        setIsLoading(true);
        setError('');
        const profileData = await chefService.getMyProfile();
        setProfile(profileData as ChefProfileResponse);
        
        setEditedBio(profileData.bio || '');
        setEditedSpecialty(profileData.portfolioDescription || '');
        setEditedYearsOfExperience(profileData.yearsOfExperience || 0);
        setEditedIsAvailable(profileData.isAvailable ?? true);
        
        const cuisineIds = (profileData as ChefProfileResponse).chefCuisines?.map(cc => cc.cuisine.id) || [];
        setSelectedCuisineIds(new Set(cuisineIds));
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao carregar perfil');
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

  const handleEdit = () => {
    setIsEditing(true);
    if (profile) {
      setEditedBio(profile.bio || '');
      setEditedSpecialty(profile.portfolioDescription || '');
      setEditedYearsOfExperience(profile.yearsOfExperience || 0);
      setEditedIsAvailable(profile.isAvailable ?? true);
      const cuisineIds = profile.chefCuisines?.map(cc => cc.cuisine.id) || [];
      setSelectedCuisineIds(new Set(cuisineIds));
    } else {
      setEditedBio('');
      setEditedSpecialty('');
      setEditedYearsOfExperience(0);
      setEditedIsAvailable(true);
      setSelectedCuisineIds(new Set());
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    if (profile) {
      setEditedBio(profile.bio || '');
      setEditedSpecialty(profile.portfolioDescription || '');
      setEditedYearsOfExperience(profile.yearsOfExperience || 0);
      setEditedIsAvailable(profile.isAvailable ?? true);
      const cuisineIds = profile.chefCuisines?.map(cc => cc.cuisine.id) || [];
      setSelectedCuisineIds(new Set(cuisineIds));
    }
  };

  const handleSave = async () => {
    if (!profile) return;

    try {
      setIsSaving(true);
      setError('');

      await chefService.updateMyProfile({
        bio: editedBio,
        portfolioDescription: editedSpecialty,
        yearsOfExperience: editedYearsOfExperience,
        isAvailable: editedIsAvailable,
      });

      const currentCuisineIds = new Set(profile.chefCuisines?.map(cc => cc.cuisine.id) || []);
      
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
      setIsEditing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar alterações');
    } finally {
      setIsSaving(false);
    }
  };

  const toggleCuisine = (cuisineId: number) => {
    setSelectedCuisineIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(cuisineId)) {
        newSet.delete(cuisineId);
      } else {
        newSet.add(cuisineId);
      }
      return newSet;
    });
  };

  const handlePictureChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/avif'];
    if (!validTypes.includes(file.type)) {
      setError('Formato de arquivo inválido. Use JPEG, PNG, WebP ou AVIF.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('Arquivo muito grande. O tamanho máximo é 5MB.');
      return;
    }

    try {
      setIsUploadingPicture(true);
      setError('');
      await chefService.uploadProfilePicture(file);
      
      const updatedProfile = await chefService.getMyProfile();
      setProfile(updatedProfile as ChefProfileResponse);
      
      await checkAuth();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao fazer upload da foto');
    } finally {
      setIsUploadingPicture(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handlePictureButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleGalleryPhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/avif'];
    if (!validTypes.includes(file.type)) {
      setError('Formato de arquivo inválido. Use JPEG, PNG, WebP ou AVIF.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('Arquivo muito grande. O tamanho máximo é 5MB.');
      return;
    }

    if (galleryPhotos.length >= 12) {
      setError('Você já atingiu o limite máximo de 12 fotos na galeria.');
      return;
    }

    try {
      setIsUploadingGalleryPhoto(true);
      setError('');
      const newPhoto = await chefService.addGalleryPhoto(file);
      setGalleryPhotos(prev => [...prev, newPhoto].sort((a, b) => a.position - b.position));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao fazer upload da foto');
    } finally {
      setIsUploadingGalleryPhoto(false);
      if (galleryFileInputRef.current) {
        galleryFileInputRef.current.value = '';
      }
    }
  };

  const handleDeleteGalleryPhoto = async (photoId: number) => {
    if (!confirm('Tem certeza que deseja remover esta foto da galeria?')) {
      return;
    }

    try {
      setError('');
      await chefService.deleteGalleryPhoto(photoId);
      setGalleryPhotos(prev => prev.filter(photo => photo.id !== photoId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao remover foto');
    }
  };

  const handleAddGalleryPhotoClick = () => {
    galleryFileInputRef.current?.click();
  };

  const bio = profile?.bio || '';
  const specialty = profile?.portfolioDescription || '';
  const yearsOfExperience = profile?.yearsOfExperience || 0;
  const isAvailable = profile?.isAvailable ?? true;
  const cuisines = profile?.chefCuisines?.map(cc => ({
    id: cc.cuisine.id,
    title: cc.cuisine.title
  })) || [];


  return (
    <div className="dashboard-layout">
      <DashboardSidebar 
        isEditing={isEditing}
        onPictureChange={handlePictureChange}
        fileInputRef={fileInputRef}
        isUploadingPicture={isUploadingPicture}
        onPictureButtonClick={handlePictureButtonClick}
      />

      <main className="dashboard-main">
        <div className="main-content">
          <div className="profile-header">
            <div className="profile-title-section">
              <h1 className="dashboard-title">Perfil</h1>
              {!isEditing && (
                <span className={`availability-badge-header ${isAvailable ? 'available' : 'unavailable'}`}>
                  {isAvailable ? ' Disponível' : ' Indisponível'}
                </span>
              )}
            </div>
            {!isEditing ? (
              <button className="edit-button" onClick={handleEdit} aria-label="Editar perfil">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M11 4H4C3.46957 4 2.96086 4.21071 2.58579 4.58579C2.21071 4.96086 2 5.46957 2 6V20C2 20.5304 2.21071 21.0391 2.58579 21.4142C2.96086 21.7893 3.46957 22 4 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V13" stroke="#ff6b35" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M18.5 2.50023C18.8978 2.10243 19.4374 1.87891 20 1.87891C20.5626 1.87891 21.1022 2.10243 21.5 2.50023C21.8978 2.89804 22.1213 3.43762 22.1213 4.00023C22.1213 4.56284 21.8978 5.10243 21.5 5.50023L12 15.0002L8 16.0002L9 12.0002L18.5 2.50023Z" stroke="#ff6b35" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            ) : (
              <div className="edit-actions">
                <button className="cancel-button" onClick={handleCancel} disabled={isSaving}>
                  Cancelar
                </button>
                <button className="save-button" onClick={handleSave} disabled={isSaving}>
                  {isSaving ? 'Salvando...' : 'Salvar'}
                </button>
              </div>
            )}
          </div>

          {error && <div className="profile-error">{error}</div>}

          {isLoading ? (
            <div className="profile-loading">Carregando...</div>
          ) : (
            <div className="profile-content">
              <section className="profile-section">
                <h2 className="section-title-orange">Biografia</h2>
                {isEditing ? (
                  <textarea
                    className="edit-textarea"
                    value={editedBio}
                    onChange={(e) => setEditedBio(e.target.value)}
                    placeholder="Escreva sua biografia..."
                    rows={4}
                  />
                ) : (
                  <p className="section-text">{bio || 'Nenhuma biografia cadastrada.'}</p>
                )}
              </section>

              <section className="profile-section">
                <h2 className="section-title-orange">Especialidade</h2>
                {isEditing ? (
                  <textarea
                    className="edit-textarea"
                    value={editedSpecialty}
                    onChange={(e) => setEditedSpecialty(e.target.value)}
                    placeholder="Descreva sua especialidade..."
                    rows={3}
                  />
                ) : (
                  <p className="section-text">{specialty || 'Nenhuma especialidade cadastrada.'}</p>
                )}
              </section>

              <section className="profile-section">
                <h2 className="section-title-orange">Anos de Experiência</h2>
                {isEditing ? (
                  <input
                    type="number"
                    className="edit-input"
                    value={editedYearsOfExperience}
                    onChange={(e) => setEditedYearsOfExperience(parseInt(e.target.value) || 0)}
                    placeholder="0"
                    min="0"
                    max="100"
                  />
                ) : (
                  <p className="section-text">
                    {yearsOfExperience > 0 
                      ? `${yearsOfExperience} ${yearsOfExperience === 1 ? 'ano' : 'anos'} de experiência`
                      : 'Não informado'}
                  </p>
                )}
              </section>

              {isEditing && (
                <section className="profile-section">
                  <h2 className="section-title-orange">Status de Disponibilidade</h2>
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
                      {editedIsAvailable ? 'Disponível para novos agendamentos' : 'Indisponível'}
                    </span>
                  </div>
                </section>
              )}

              <section className="profile-section">
                <h2 className="section-title-orange">Categorias</h2>
                {isEditing ? (
                  <div className="categories-edit-container">
                    {isLoadingCuisines ? (
                      <p className="section-text">Carregando categorias...</p>
                    ) : (
                      <>
                        <p className="categories-hint">Clique nas categorias para adicionar ou remover:</p>
                        <div className="available-categories">
                          {availableCuisines.map((cuisine) => {
                            const isSelected = selectedCuisineIds.has(cuisine.id);
                            return (
                              <button
                                key={cuisine.id}
                                type="button"
                                className={`category-tag ${isSelected ? 'selected' : ''}`}
                                onClick={() => toggleCuisine(cuisine.id)}
                              >
                                {cuisine.title}
                                {isSelected && <span className="category-check"></span>}
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
                      <p className="section-text">Nenhuma categoria cadastrada.</p>
                    )}
                  </div>
                )}
              </section>

              {!isEditing && (
                <>
                  <button className="menu-button">Ver Cardápio completo</button>

                  <div className="add-photos-section">
                    <input
                      ref={galleryFileInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/avif"
                      onChange={handleGalleryPhotoChange}
                      style={{ display: 'none' }}
                      disabled={isUploadingGalleryPhoto || galleryPhotos.length >= 12}
                    />
                    <button 
                      className="add-photos-button" 
                      aria-label="Adicionar mais fotos"
                      onClick={handleAddGalleryPhotoClick}
                      disabled={isUploadingGalleryPhoto || galleryPhotos.length >= 12}
                    >
                      {isUploadingGalleryPhoto ? (
                        <div className="upload-spinner-small">...</div>
                      ) : (
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M12 5V19M5 12H19" stroke="#ff6b35" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      )}
                    </button>
                    <span className="add-photos-text">
                      {isUploadingGalleryPhoto 
                        ? 'Enviando...' 
                        : galleryPhotos.length >= 12 
                          ? 'Limite de 12 fotos atingido' 
                          : 'Adicione mais fotos'}
                    </span>
                  </div>

                  <div className="gallery-section">
                    {isLoadingGallery ? (
                      <div className="gallery-empty">
                        <p>Carregando galeria...</p>
                      </div>
                    ) : galleryPhotos.length > 0 ? (
                      <div className="gallery-grid">
                        {galleryPhotos.map((photo) => (
                          <div key={photo.id} className="gallery-item">
                            <img src={photo.url} alt={photo.caption || `Foto ${photo.position}`} />
                            <button
                              className="gallery-item-delete"
                              onClick={() => handleDeleteGalleryPhoto(photo.id)}
                              aria-label="Remover foto"
                              title="Remover foto"
                            >
                              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M18 6L6 18M6 6L18 18" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                              </svg>
                            </button>
                            {photo.caption && (
                              <div className="gallery-item-caption">{photo.caption}</div>
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
                </>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default ProfilePage;
