import React, { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import perfilVazio from "../assets/perfilvazio.png";
import facebookIcon from "../assets/facebook.svg";
import instagramIcon from "../assets/instagran.svg";
import xIcon from "../assets/x.svg";

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

  const profilePicture = user?.profilePictureUrl;
  const fallbackImage = perfilVazio;

  useEffect(() => {
    setImageError(false);
  }, [profilePicture]);

  const imageSrc =
    profilePicture && !imageError ? profilePicture : fallbackImage;

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
            <a href="#" className="social-icon" aria-label="Facebook">
              <img src={facebookIcon} alt="Facebook" />
            </a>
            <a href="#" className="social-icon" aria-label="Instagram">
              <img src={instagramIcon} alt="Instagram" />
            </a>
            <a href="#" className="social-icon" aria-label="X (Twitter)">
              <img src={xIcon} alt="X (Twitter)" />
            </a>
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
