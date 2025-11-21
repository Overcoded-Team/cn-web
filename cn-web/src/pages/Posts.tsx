import React, { useState, useMemo } from "react";
import "./Posts.css";
import "./Dashboard.css";
import "./DashboardDark.css";
import { DashboardSidebar } from "../components/DashboardSidebar";
import { useAuth } from "../contexts/AuthContext";
import perfilVazio from "../assets/perfilvazio.png";
import bandeiraIcon from "../assets/bandeira.svg";

const Posts: React.FC = () => {
  const { user } = useAuth();
  const [theme, setTheme] = useState<"dark" | "light">(() => {
    const savedTheme = localStorage.getItem("dashboard-theme");
    return (savedTheme as "dark" | "light") || "dark";
  });
  const [postContent, setPostContent] = useState("");
  const [imageError, setImageError] = useState(false);

  const profilePicture = user?.profilePictureUrl;
  const fallbackImage = perfilVazio;

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

  const toggleTheme = () => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  };

  React.useEffect(() => {
    localStorage.setItem("dashboard-theme", theme);
  }, [theme]);

  React.useEffect(() => {
    setImageError(false);
  }, [profilePicture]);

  const handlePhotoVideoClick = () => {
    console.log("Foto/vídeo clicked");
  };

  const handleEventUpdateClick = () => {
    console.log("Atualização de acontecimento clicked");
  };

  return (
    <div className={`dashboard-layout ${theme === "light" ? "dashboard-light" : "dashboard-dark"}`}>
      <DashboardSidebar />
      <main className={`dashboard-main ${theme === "light" ? "dashboard-light-main" : "dashboard-dark-main"}`}>
        <div className={`dashboard-content ${theme === "light" ? "dashboard-light-content" : "dashboard-dark-content"}`}>
          <div className={`dashboard-header ${theme === "light" ? "dashboard-light-header" : "dashboard-dark-header"}`}>
            <h1 className={`dashboard-title ${theme === "light" ? "dashboard-light-title" : "dashboard-dark-title"}`}>Posts</h1>
            <div className="theme-toggle-container">
              <span className="theme-toggle-label">Tema</span>
              <button
                className={`theme-toggle-switch ${theme === "light" ? "theme-toggle-on" : "theme-toggle-off"}`}
                onClick={toggleTheme}
                title={theme === "dark" ? "Alternar para tema claro" : "Alternar para tema escuro"}
                type="button"
                role="switch"
                aria-checked={theme === "light"}
                aria-label={theme === "dark" ? "Alternar para tema claro" : "Alternar para tema escuro"}
              >
                <span className="theme-toggle-slider"></span>
              </button>
            </div>
          </div>

          <div className="create-post-card">
            <div className="create-post-content">
              <div className="create-post-profile">
                <img
                  src={imageSrc}
                  alt={user?.name || "Chef"}
                  className="create-post-avatar"
                  onError={() => {
                    if (profilePicture && !imageError) {
                      setImageError(true);
                    }
                  }}
                />
              </div>
              <input
                type="text"
                className="create-post-input"
                placeholder="No que você está pensando?"
                value={postContent}
                onChange={(e) => setPostContent(e.target.value)}
              />
            </div>
            <div className="create-post-separator"></div>
            <div className="create-post-actions">
              <button
                className="create-post-action-btn photo-video-btn"
                onClick={handlePhotoVideoClick}
              >
                <svg
                  className="create-post-action-icon"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M4 16L8.586 11.414C9.367 10.633 10.633 10.633 11.414 11.414L16 16M14 14L15.586 12.414C16.367 11.633 17.633 11.633 18.414 12.414L22 16M14 8H14.01M6 20H18C19.1046 20 20 19.1046 20 18V6C20 4.89543 19.1046 4 18 4H6C4.89543 4 4 4.89543 4 6V18C4 19.1046 4.89543 20 6 20Z"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <span>Foto/vídeo</span>
              </button>
              <button
                className="create-post-action-btn event-btn"
                onClick={handleEventUpdateClick}
              >
                <img src={bandeiraIcon} alt="Atualização de acontecimento" className="create-post-action-icon" />
                <span>Atualização de acontecimento</span>
              </button>
            </div>
          </div>

          <div className="dashboard-dark-card">
            <div className="posts-empty">
              <p>Nenhum post encontrado.</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Posts;

