import React, { useEffect, useState, useMemo } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import perfilVazio from "../assets/perfilvazio.png";
import sairIcon from "../assets/sair.svg";
import editIcon from "../assets/edit.svg";
import "../pages/chef/Dashboard.css";
import "../pages/chef/themes/Dashboard.light.css";

interface DashboardTopNavProps {
  isEditing?: boolean;
  onPictureChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  fileInputRef?: React.RefObject<HTMLInputElement>;
  isUploadingPicture?: boolean;
  onPictureButtonClick?: () => void;
}

export const DashboardTopNav: React.FC<DashboardTopNavProps> = ({
  isEditing = false,
  onPictureChange,
  fileInputRef,
  isUploadingPicture = false,
  onPictureButtonClick,
}) => {
  const { user, logout } = useAuth();
  const location = useLocation();

  const chefName = user?.name || "Chef";
  const [imageError, setImageError] = useState(false);

  const profilePicture = user?.profilePictureUrl;
  const fallbackImage = perfilVazio;

  useEffect(() => {
    setImageError(false);
  }, [profilePicture]);

  const imageSrc = useMemo(() => {
    if (profilePicture && !imageError) {
      const separator = profilePicture.includes('?') ? '&' : '?';
      const urlHash = profilePicture.split('').reduce((acc, char) => {
        return ((acc << 5) - acc) + char.charCodeAt(0);
      }, 0);
      return `${profilePicture}${separator}v=${urlHash}`;
    }
    return fallbackImage;
  }, [profilePicture, imageError, fallbackImage]);


  return (
    <nav className="dashboard-top-nav">
      <div className="top-nav-content">
        <div className="top-nav-left">
          <Link to="/dashboard" className="top-nav-logo">
            <div className="top-nav-profile-photo-wrapper">
              <div className="top-nav-profile-photo">
                <img
                  src={imageSrc}
                  alt={`Chef ${chefName}`}
                  className="top-nav-avatar"
                  key={profilePicture || 'default'}
                  onError={() => {
                    if (profilePicture && !imageError) {
                      setImageError(true);
                    }
                  }}
                  onLoad={() => {
                    if (imageError) {
                      setImageError(false);
                    }
                  }}
                />
                {isUploadingPicture && (
                  <div className="top-nav-profile-photo-overlay">
                    <div className="upload-spinner-small">...</div>
                  </div>
                )}
              </div>
              {isEditing && onPictureChange && fileInputRef && (
                <>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/avif"
                    onChange={onPictureChange}
                    style={{ display: "none" }}
                  />
                  <button
                    type="button"
                    className="top-nav-change-picture-button"
                    onClick={onPictureButtonClick}
                    disabled={isUploadingPicture}
                    aria-label="Alterar foto de perfil"
                  >
                    <img src={editIcon} alt="Editar" width="14" height="14" />
                  </button>
                </>
              )}
            </div>
            <div className="top-nav-chef-info">
              <p className="top-nav-chef-label">Chef</p>
              <p className="top-nav-chef-name">{chefName}</p>
            </div>
          </Link>
        </div>

        <div className="top-nav-center">
          <Link
            to="/dashboard"
            className={`top-nav-link ${
              location.pathname === "/dashboard" || location.pathname === "/"
                ? "active"
                : ""
            }`}
          >
            Dashboard
          </Link>
          <Link
            to="/perfil"
            className={`top-nav-link ${
              location.pathname === "/perfil" ? "active" : ""
            }`}
          >
            Perfil
          </Link>
          <Link
            to="/agendamentos"
            className={`top-nav-link ${
              location.pathname === "/agendamentos" ||
              location.pathname === "/preview/agendamentos"
                ? "active"
                : ""
            }`}
          >
            Agendamentos
          </Link>
          <Link
            to="/historico"
            className={`top-nav-link ${
              location.pathname === "/historico" ? "active" : ""
            }`}
          >
            Histórico
          </Link>
        </div>

        <div className="top-nav-right">
          <button className="top-nav-logout-button" onClick={logout} aria-label="Sair">
            <img src={sairIcon} alt="Sair" className="top-nav-logout-icon" />
            <span>Sair</span>
          </button>
        </div>
      </div>
    </nav>
  );
};

