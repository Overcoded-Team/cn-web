import React, { useState, useRef, useEffect } from "react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import estrelaInteira from "../assets/estrelainteira.png";
import meiaEstrela from "../assets/meiaestrela.png";
import estrelaVazia from "../assets/estrelavazia.png";
import perfilVazio from "../assets/perfilvazio.png";
import { chefService, Chef, Cuisine } from "../services/chef.service";

const ChefsPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCuisineId, setSelectedCuisineId] = useState<
    number | undefined
  >();
  const [chefs, setChefs] = useState<Chef[]>([]);
  const [cuisines, setCuisines] = useState<Cuisine[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const categoriesRef = useRef<HTMLDivElement>(null);

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
              {chefs.map((chef) => (
                <div
                  key={chef.id}
                  className="chef-card"
                  onClick={handleChefCardClick}
                  style={{ cursor: "pointer" }}
                >
                  <div className="chef-card-image">
                    <img src={perfilVazio} alt={chef.name} />
                  </div>
                  <div className="chef-card-info">
                    <h3 className="chef-card-name">{chef.name}</h3>
                    <p className="chef-card-specialty">
                      {chef.cuisines.length > 0
                        ? chef.cuisines.map((c) => c.name).join(", ")
                        : "Sem especialidade definida"}
                    </p>
                    <p className="chef-card-description">
                      {chef.bio || "Chef sem descrição disponível"}
                    </p>
                    <div className="chef-card-rating">
                      <span className="rating-value">
                        {(() => {
                          const rounded = Math.round(chef.avgRating * 2) / 2;
                          return rounded % 1 === 0
                            ? rounded.toFixed(1)
                            : rounded;
                        })()}
                      </span>
                      <div className="rating-stars">
                        {renderStars(chef.avgRating)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
      <Footer />
    </>
  );
};

export default ChefsPage;
