import React, { useState, useRef, useEffect } from "react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import estrelaInteira from "../assets/estrelainteira.png";
import meiaEstrela from "../assets/meiaestrela.png";
import estrelaVazia from "../assets/estrelavazia.png";
import perfilVazio from "../assets/perfilvazio.png";
import facebookIcon from "../assets/facebook.svg";
import instagramIcon from "../assets/instagram.svg";
import youtubeIcon from "../assets/yt.svg";
import tiktokIcon from "../assets/tiktok.svg";
import whatsappIcon from "../assets/whatsapp.svg";
import { chefService, Chef, Cuisine, ChefSocialLink } from "../services/chef.service";
import "./ChefsPage.css";

const ChefsPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCuisineId, setSelectedCuisineId] = useState<
    number | undefined
  >();
  const [chefs, setChefs] = useState<Chef[]>([]);
  const [cuisines, setCuisines] = useState<Cuisine[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [imageErrors, setImageErrors] = useState<Record<number, boolean>>({});
  const categoriesRef = useRef<HTMLDivElement>(null);

  const calculateAvgRating = (chef: Chef): number => {
    if (chef.reviews && chef.reviews.length > 0) {
      const totalRating = chef.reviews.reduce((sum, review) => sum + review.rating, 0);
      const avgRating10 = totalRating / chef.reviews.length;
      return (avgRating10 / 10) * 5;
    } else if (chef.avgRating) {
      return (chef.avgRating / 10) * 5;
    }
    return 0;
  };

  const renderStars = (rating: number) => {
    const roundedRating = Math.round(rating * 2) / 2;

    const stars = [];
    const fullStars = Math.floor(roundedRating);
    const hasHalfStar = roundedRating % 1 === 0.5;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

    for (let i = 0; i < fullStars; i++) {
      stars.push(
        <img
          key={`full-${i}`}
          src={estrelaInteira}
          alt="Estrela inteira"
          className="star-icon"
        />
      );
    }

    if (hasHalfStar) {
      stars.push(
        <img
          key="half"
          src={meiaEstrela}
          alt="Meia estrela"
          className="star-icon"
        />
      );
    }

    for (let i = 0; i < emptyStars; i++) {
      stars.push(
        <img
          key={`empty-${i}`}
          src={estrelaVazia}
          alt="Estrela vazia"
          className="star-icon"
        />
      );
    }

    return stars;
  };

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

  const renderSocialLinks = (socialLinks?: ChefSocialLink[] | any) => {
    if (!socialLinks) {
      return null;
    }

    const linksArray = Array.isArray(socialLinks) ? socialLinks : [];
    
    if (linksArray.length === 0) {
      return null;
    }

    const validLinks = linksArray.filter((link: any) => link && link.type && link.url);

    if (validLinks.length === 0) {
      return null;
    }

    return (
      <div className="chef-card-social-links">
        {validLinks.map((link: any, index: number) => {
          const icon = getSocialIcon(link.type);
          if (!icon) return null;

          const url = getSocialUrl(link);

          return (
            <a
              key={index}
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="chef-card-social-icon"
              aria-label={link.type}
              onClick={(e) => e.stopPropagation()}
            >
              <img src={icon} alt={link.type} />
            </a>
          );
        })}
      </div>
    );
  };

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    loadCuisines();
  }, []);

  useEffect(() => {
    loadChefs();
  }, [selectedCuisineId]);

  const loadCuisines = async () => {
    try {
      const data = await chefService.listCuisines(1, 100);
      setCuisines(data);
    } catch (err) {}
  };

  const loadChefs = async () => {
    try {
      setIsLoading(true);
      setError("");
      const response = await chefService.listChefs({
        page: 1,
        limit: 100,
        cuisineId: selectedCuisineId,
        available: true,
        sortBy: "avgRating",
        sortDir: "DESC",
      });
      setChefs(response.items);
    } catch (err) {
      setError("Erro ao carregar chefs. Tente novamente mais tarde.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCuisineClick = (cuisineId: number) => {
    setSelectedCuisineId(
      selectedCuisineId === cuisineId ? undefined : cuisineId
    );
  };

  const scrollCategories = (direction: "left" | "right") => {
    if (categoriesRef.current) {
      const scrollAmount = 200;
      categoriesRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

  const detectOS = (): "ios" | "android" | "other" => {
    const userAgent = window.navigator.userAgent.toLowerCase();
    if (/iphone|ipad|ipod/.test(userAgent)) {
      return "ios";
    }
    if (/android/.test(userAgent)) {
      return "android";
    }
    return "other";
  };

  const handleChefCardClick = () => {
    const os = detectOS();
    if (os === "ios") {
      window.open("https://apps.apple.com", "_blank");
    } else if (os === "android") {
      window.open("https://play.google.com/store", "_blank");
    } else {
      window.open("https://play.google.com/store", "_blank");
    }
  };

  return (
    <>
      <Header />
      <div className="chefs-page">
        <section className="chefs-banner">
          <div className="chefs-banner-content">
            <h1 className="chefs-banner-title">
              Encontre o Chef ideal para voce
            </h1>
            <div className="chefs-search-container">
              <div className="chefs-search-box">
                <svg
                  className="search-icon"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <circle cx="11" cy="11" r="8"></circle>
                  <path d="m21 21-4.35-4.35"></path>
                </svg>
                <input
                  type="text"
                  placeholder="Busque por uma categoria ou prato"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="chefs-search-input"
                />
              </div>
            </div>

            <div className="categories-container">
              <button
                className="category-nav-btn category-nav-left"
                onClick={() => scrollCategories("left")}
                aria-label="Categorias anteriores"
              >
                ‹
              </button>
              <div className="categories-scroll" ref={categoriesRef}>
                {cuisines.map((cuisine) => (
                  <button
                    key={cuisine.id}
                    className={`category-chip ${
                      selectedCuisineId === cuisine.id ? "active" : ""
                    }`}
                    onClick={() => handleCuisineClick(cuisine.id)}
                  >
                    <span className="category-name">{cuisine.title}</span>
                  </button>
                ))}
              </div>
              <button
                className="category-nav-btn category-nav-right"
                onClick={() => scrollCategories("right")}
                aria-label="Próximas categorias"
              >
                ›
              </button>
            </div>
          </div>
        </section>

        <section className="chefs-grid-section">
          {isLoading ? (
            <div style={{ textAlign: "center", padding: "2rem" }}>
              <p>Carregando chefs...</p>
            </div>
          ) : error ? (
            <div
              style={{ textAlign: "center", padding: "2rem", color: "#f44336" }}
            >
              <p>{error}</p>
            </div>
          ) : chefs.length === 0 ? (
            <div style={{ textAlign: "center", padding: "2rem" }}>
              <p>Nenhum chef encontrado.</p>
            </div>
          ) : (
            <div className="chefs-grid-container">
              {chefs.map((chef) => {
                const imageSrc =
                  chef.profilePictureUrl && !imageErrors[chef.id]
                    ? chef.profilePictureUrl
                    : perfilVazio;

                return (
                  <div
                    key={chef.id}
                    className="chef-card"
                    onClick={handleChefCardClick}
                    style={{ cursor: "pointer" }}
                  >
                    <div className="chef-card-image">
                      <img
                        src={imageSrc}
                        alt={chef.name}
                        onError={() => {
                          if (chef.profilePictureUrl && !imageErrors[chef.id]) {
                            setImageErrors((prev) => ({
                              ...prev,
                              [chef.id]: true,
                            }));
                          }
                        }}
                      />
                    </div>
                    <div className="chef-card-info">
                      <h3 className="chef-card-name">{chef.name}</h3>
                      <p className="chef-card-specialty">
                        {chef.cuisines &&
                        Array.isArray(chef.cuisines) &&
                        chef.cuisines.length > 0
                          ? chef.cuisines
                              .filter((c) => c && c.name)
                              .map((c) => c.name)
                              .join(", ")
                          : "Sem especialidade definida"}
                      </p>
                      <p className="chef-card-description">
                        {chef.bio || "Chef sem descrição disponível"}
                      </p>
                      <div className="chef-card-rating">
                        <div className="rating-content">
                          <span className="rating-value">
                            {(() => {
                              const avgRating5 = calculateAvgRating(chef);
                              const rounded = Math.round(avgRating5 * 2) / 2;
                              return rounded.toFixed(1);
                            })()}
                          </span>
                          <div className="rating-stars">
                            {renderStars(calculateAvgRating(chef))}
                          </div>
                          {chef.reviews && chef.reviews.length > 0 && (
                            <span className="rating-count">
                              ({chef.reviews.length})
                            </span>
                          )}
                        </div>
                        {renderSocialLinks(chef.socialLinks)}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
      <Footer />
    </>
  );
};

export default ChefsPage;
