import React, { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import perfilVazio from "../assets/perfilvazio.png";
import facebookIcon from "../assets/facebook.svg";
import instagramIcon from "../assets/instagram.svg";
import youtubeIcon from "../assets/yt.svg";
import tiktokIcon from "../assets/tiktok.svg";
import whatsappIcon from "../assets/whatsapp.svg";
import sairIcon from "../assets/sair.svg";
import { chefService, ChefSocialLink } from "../services/chef.service";

interface DashboardSidebarProps {
  className?: string;
  isEditing?: boolean;
  onPictureChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  fileInputRef?: React.RefObject<HTMLInputElement>;
  isUploadingPicture?: boolean;
  onPictureButtonClick?: () => void;
}

export const DashboardSidebar: React.FC<DashboardSidebarProps> = ({
  className = "",
  isEditing = false,
  onPictureChange,
  fileInputRef,
  isUploadingPicture = false,
  onPictureButtonClick,
}) => {
  const location = useLocation();
  const { user, logout } = useAuth();

  const chefName = user?.name || "Chef";
  const [imageError, setImageError] = useState(false);
  const [socialLinks, setSocialLinks] = useState<ChefSocialLink[]>([]);

  const profilePicture = user?.profilePictureUrl;
  const fallbackImage = perfilVazio;

  useEffect(() => {
    setImageError(false);
  }, [profilePicture]);

  useEffect(() => {
    const loadSocialLinks = async () => {
      try {
        const links = await chefService.getMySocialLinks();
        console.log("Redes sociais carregadas:", links);
        setSocialLinks(links);
      } catch (error) {
        console.error("Erro ao carregar redes sociais:", error);
      }
    };

    if (user) {
      loadSocialLinks();
    }
  }, [user]);

  const imageSrc =
    profilePicture && !imageError ? profilePicture : fallbackImage;

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

  const renderSocialLinks = () => {
    if (!socialLinks || socialLinks.length === 0) {
      return null;
    }

    return socialLinks.map((link, index) => {
      const icon = getSocialIcon(link.type);
      if (!icon) return null;

      const url = getSocialUrl(link);

      return (
        <a
          key={index}
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="social-icon"
          aria-label={link.type}
        >
          <img src={icon} alt={link.type} />
        </a>
      );
    });
  };

  return (
    <aside className={`dashboard-sidebar ${className}`}>
      <div className="sidebar-content">
        <div className="chef-profile">
          <div className="profile-photo">
            <img
              src={imageSrc}
              alt={`Chef ${chefName}`}
              className="chef-avatar"
              onError={() => {
                if (profilePicture && !imageError) {
                  setImageError(true);
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
                style={{ display: 'none' }}
              />
              <button
                type="button"
                className="change-picture-sidebar-button"
                onClick={onPictureButtonClick}
                disabled={isUploadingPicture}
                aria-label="Alterar foto de perfil"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M11 4H4C3.46957 4 2.96086 4.21071 2.58579 4.58579C2.21071 4.96086 2 5.46957 2 6V20C2 20.5304 2.21071 21.0391 2.58579 21.4142C2.96086 21.7893 3.46957 22 4 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V13" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M18.5 2.50023C18.8978 2.10243 19.4374 1.87891 20 1.87891C20.5626 1.87891 21.1022 2.10243 21.5 2.50023C21.8978 2.89804 22.1213 3.43762 22.1213 4.00023C22.1213 4.56284 21.8978 5.10243 21.5 5.50023L12 15.0002L8 16.0002L9 12.0002L18.5 2.50023Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </>
          )}
          <div className="chef-info">
            <p className="chef-label">Chef</p>
            <p className="chef-name">{chefName}</p>
          </div>
          <div className="social-media-icons">{renderSocialLinks()}</div>
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
          <a href="#" className="nav-item">
            Agendamentos
          </a>
          <Link
            to="/historico"
            className={`nav-item ${
              location.pathname === "/historico" ? "active" : ""
            }`}
          >
            Histórico
          </Link>
        </nav>

        <button className="logout-button" onClick={logout} aria-label="Sair">
          <img src={sairIcon} alt="Sair" className="logout-icon" />
          <span>Sair</span>
        </button>
      </div>
    </aside>
  );
};
