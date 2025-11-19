import React, { useEffect, useState, useMemo } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import perfilVazio from "../assets/perfilvazio.png";
import facebookIcon from "../assets/facebook.svg";
import instagramIcon from "../assets/instagram.svg";
import youtubeIcon from "../assets/yt.svg";
import tiktokIcon from "../assets/tiktok.svg";
import whatsappIcon from "../assets/whatsapp.svg";
import sairIcon from "../assets/sair.svg";
import editIcon from "../assets/edit.svg";
import { chefService, ChefSocialLink } from "../services/chef.service";
import "../pages/Dashboard.css";
import "../pages/DashboardDark.css";

interface DashboardSidebarProps {
  className?: string;
  isEditing?: boolean;
  onPictureChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  fileInputRef?: React.RefObject<HTMLInputElement>;
  isUploadingPicture?: boolean;
  onPictureButtonClick?: () => void;
  theme?: "dark" | "light";
  onThemeToggle?: () => void;
}

export const DashboardSidebar: React.FC<DashboardSidebarProps> = ({
  className = "",
  isEditing = false,
  onPictureChange,
  fileInputRef,
  isUploadingPicture = false,
  onPictureButtonClick,
  theme = "dark",
  onThemeToggle,
}) => {
  const { user, logout } = useAuth();
  const location = useLocation();

  const chefName = user?.name || "Chef";
  const [imageError, setImageError] = useState(false);
  const [socialLinks, setSocialLinks] = useState<ChefSocialLink[]>([]);

  const profilePicture = user?.profilePictureUrl;
  const fallbackImage = perfilVazio;

  useEffect(() => {
    // Reset image error when profile picture URL changes
    setImageError(false);
  }, [profilePicture]);

  useEffect(() => {
    const loadSocialLinks = async () => {
      try {
        const links = await chefService.getMySocialLinks();
        setSocialLinks(links);
      } catch (error) {}
    };

    if (user) {
      loadSocialLinks();
      
      if (isEditing) {
        const interval = setInterval(() => {
          loadSocialLinks();
        }, 2000);
        
        return () => clearInterval(interval);
      }
    }
  }, [user, isEditing]);

  const imageSrc = useMemo(() => {
    if (profilePicture && !imageError) {
      // Add cache-busting parameter only when URL changes (not on every render)
      const separator = profilePicture.includes('?') ? '&' : '?';
      // Use a hash of the URL to create a stable cache-busting parameter
      const urlHash = profilePicture.split('').reduce((acc, char) => {
        return ((acc << 5) - acc) + char.charCodeAt(0);
      }, 0);
      return `${profilePicture}${separator}v=${urlHash}`;
    }
    return fallbackImage;
  }, [profilePicture, imageError, fallbackImage]);

  const getSocialIcon = (type: string) => {
    switch (type) {
      case "INSTAGRAM":
        return instagramIcon;
      case "FACEBOOK":
        return facebookIcon;
      case "YOUTUBE":
        return youtubeIcon;
      case "TIKTOK":
        return tiktokIcon;
      case "WHATSAPP":
        return whatsappIcon;
      default:
        return null;
    }
  };

  const formatWhatsAppUrl = (url: string): string => {
    try {
      if (url.includes("wa.me")) {
        return url;
      }

      const digitsOnly = url.replace(/\D/g, "");

      if (!digitsOnly) {
        return url;
      }

      return `https://wa.me/${digitsOnly}`;
    } catch (error) {
      return url;
    }
  };

  const getSocialUrl = (link: ChefSocialLink): string => {
    if (link.type === "WHATSAPP") {
      return formatWhatsAppUrl(link.url);
    }
    return link.url;
  };

  const renderSocialLinks = useMemo(() => {
    if (!socialLinks || socialLinks.length === 0) {
      return null;
    }

    return socialLinks.map((link) => {
      const icon = getSocialIcon(link.type);
      if (!icon) return null;

      const url = getSocialUrl(link);

      return (
        <a
          key={link.type}
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="social-icon"
          aria-label={link.type}
        >
          <img src={icon} alt={link.type} style={{ display: 'block' }} />
        </a>
      );
    });
  }, [socialLinks]);

  return (
    <aside className={`dashboard-sidebar ${className}`} style={{ zIndex: 1000, position: 'fixed', left: 0, top: 0, width: '280px', height: '100vh' }}>
      <div className="sidebar-content">
        <div className="chef-profile">
          <div className="profile-photo-wrapper">
          <div className="profile-photo">
            <img
              src={imageSrc}
              alt={`Chef ${chefName}`}
              className="chef-avatar"
              key={profilePicture || 'default'} // Force re-render when URL changes
              onError={() => {
                if (profilePicture && !imageError) {
                  setImageError(true);
                }
              }}
              onLoad={() => {
                // Reset error state if image loads successfully
                if (imageError) {
                  setImageError(false);
                }
              }}
            />
            {isUploadingPicture && (
              <div className="profile-photo-overlay">
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
                className="change-picture-sidebar-button"
                onClick={onPictureButtonClick}
                disabled={isUploadingPicture}
                aria-label="Alterar foto de perfil"
              >
                  <img src={editIcon} alt="Editar" width="16" height="16" />
              </button>
            </>
          )}
          </div>
          <div className="chef-info">
            <p className="chef-label">Chef</p>
            <p className="chef-name">{chefName}</p>
          </div>
          <div className="social-media-icons">{renderSocialLinks}</div>
        </div>

        <nav className="sidebar-nav">
          <Link
            to="/dashboard"
            className={`nav-item ${
              location.pathname === "/dashboard" || location.pathname === "/"
                ? "active"
                : ""
            }`}
          >
            Dashboard
          </Link>
          <Link
            to="/perfil"
            className={`nav-item ${
              location.pathname === "/perfil" ? "active" : ""
            }`}
          >
            Perfil
          </Link>
          <Link
            to="/agendamentos"
            className={`nav-item ${
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
            className={`nav-item ${
              location.pathname === "/historico" ? "active" : ""
            }`}
          >
            Histórico
          </Link>
          {onThemeToggle && (
            <button
              className={`theme-toggle-switch ${theme === "light" ? "theme-toggle-on" : "theme-toggle-off"}`}
              onClick={onThemeToggle}
              title={theme === "dark" ? "Alternar para tema claro" : "Alternar para tema escuro"}
              type="button"
              role="switch"
              aria-checked={theme === "light"}
              aria-label={theme === "dark" ? "Alternar para tema claro" : "Alternar para tema escuro"}
              style={{ margin: "0.5rem 1.5rem", alignSelf: "stretch" }}
            >
              <span className="theme-toggle-slider"></span>
            </button>
          )}
        </nav>

        <button className="logout-button" onClick={logout} aria-label="Sair">
          <img src={sairIcon} alt="Sair" className="logout-icon" />
          <span>Sair</span>
        </button>
      </div>
    </aside>
  );
};
