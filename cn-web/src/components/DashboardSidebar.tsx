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
}

export const DashboardSidebar: React.FC<DashboardSidebarProps> = ({
  className = "",
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
      // Se já for um link wa.me, retorna como está
      if (url.includes("wa.me")) {
        return url;
      }

      // Extrai apenas os dígitos da URL
      const digitsOnly = url.replace(/\D/g, "");

      // Se não tiver dígitos, retorna a URL original
      if (!digitsOnly) {
        return url;
      }

      // Formata para wa.me
      return `https://wa.me/${digitsOnly}`;
    } catch (error) {
      // Em caso de erro, retorna a URL original
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
          </div>
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

        <button className="logout-button" onClick={logout} aria-label="Sair">
          <img src={sairIcon} alt="Sair" className="logout-icon" />
          <span>Sair</span>
        </button>
      </div>
    </aside>
  );
};
