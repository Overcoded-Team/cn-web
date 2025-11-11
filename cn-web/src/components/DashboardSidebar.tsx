import React, { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import perfilVazio from "../assets/perfilvazio.png";
import facebookIcon from "../assets/facebook.svg";
import instagramIcon from "../assets/instagran.svg";
import { chefService, ChefSocialLink } from "../services/chef.service";

interface DashboardSidebarProps {
  className?: string;
}

export const DashboardSidebar: React.FC<DashboardSidebarProps> = ({
  className = "",
}) => {
  const location = useLocation();
  const { user } = useAuth();

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
        return (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
            <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
          </svg>
        );
      case "TIKTOK":
        return (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
            <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
          </svg>
        );
      case "WHATSAPP":
        return (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
          </svg>
        );
      default:
        return null;
    }
  };

  const renderSocialLinks = () => {
    if (!socialLinks || socialLinks.length === 0) {
      return null;
    }

    return socialLinks.map((link, index) => {
      const icon = getSocialIcon(link.type);
      if (!icon) return null;

      return (
        <a
          key={index}
          href={link.url}
          target="_blank"
          rel="noopener noreferrer"
          className="social-icon"
          aria-label={link.type}
        >
          {typeof icon === "string" ? (
            <img src={icon} alt={link.type} />
          ) : (
            icon
          )}
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
          </div>
          <div className="chef-info">
            <p className="chef-label">Chef</p>
            <p className="chef-name">{chefName}</p>
          </div>
          <div className="social-media-icons">
            {renderSocialLinks()}
          </div>
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
          <a href="#" className="nav-item">
            Perfil
          </a>
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
      </div>
    </aside>
  );
};
