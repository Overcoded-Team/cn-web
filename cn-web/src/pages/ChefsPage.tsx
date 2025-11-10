import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import estrelaInteira from '../assets/estrelainteira.png';
import meiaEstrela from '../assets/meiaestrela.png';
import estrelaVazia from '../assets/estrelavazia.png';

const ChefsPage: React.FC = () => {
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState('');
    const categoriesRef = useRef<HTMLDivElement>(null);

    const renderStars = (rating: number) => {
        const roundedRating = Math.round(rating * 2) / 2;
        
        const stars = [];
        const fullStars = Math.floor(roundedRating);
        const hasHalfStar = roundedRating % 1 === 0.5;
        const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

        for (let i = 0; i < fullStars; i++) {
            stars.push(
                <img key={`full-${i}`} src={estrelaInteira} alt="Estrela inteira" className="star-icon" />
            );
        }

        if (hasHalfStar) {
            stars.push(
                <img key="half" src={meiaEstrela} alt="Meia estrela" className="star-icon" />
            );
        }

        for (let i = 0; i < emptyStars; i++) {
            stars.push(
                <img key={`empty-${i}`} src={estrelaVazia} alt="Estrela vazia" className="star-icon" />
            );
        }

        return stars;
    };

    useEffect(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, []);

    const categories = [
        { name: 'Massas', icon: '🍝' },
        { name: 'Pães', icon: '🥖' },
        { name: 'Sobremesas', icon: '🍰' },
        { name: 'Asiático', icon: '🍜' },
        { name: 'Vegano', icon: '🌱' },
        { name: 'Caseira', icon: '🍲' },
        { name: 'Pizza', icon: '🍕' },
        { name: 'Frutos do Mar', icon: '🦐' },
        { name: 'Churrasco', icon: '🥩' },
        { name: 'Italiana', icon: '🍝' },
        { name: 'Francesa', icon: '🥐' },
        { name: 'Japonesa', icon: '🍣' },
        { name: 'Mexicana', icon: '🌮' },
        { name: 'Árabe', icon: '🥙' },
        { name: 'Vegetariana', icon: '🥗' },
        { name: 'Doces', icon: '🍬' },
        { name: 'Bebidas', icon: '🍹' },
        { name: 'Café da Manhã', icon: '☕' },
    ];

    const chefs = [
        {
            id: 1,
            name: 'Chef João Silva',
            specialty: 'Culinária Italiana',
            description: 'Especialista em massas frescas e molhos tradicionais',
            rating: 4.8,
            image: 'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=400&h=400&fit=crop'
        },
        {
            id: 2,
            name: 'Chef Maria Santos',
            specialty: 'Culinária Brasileira',
            description: 'Sabores autênticos da culinária regional brasileira',
            rating: 4.9,
            image: 'https://images.unsplash.com/photo-1577219491135-ce391730fb2c?w=400&h=400&fit=crop'
        },
        {
            id: 3,
            name: 'Chef Carlos Oliveira',
            specialty: 'Culinária Gourmet',
            description: 'Experiências gastronômicas sofisticadas e únicas',
            rating: 4.7,
            image: 'https://images.unsplash.com/photo-1600565193348-f74bd3c7ccdf?w=400&h=400&fit=crop'
        },
        {
            id: 4,
            name: 'Chef Ana Costa',
            specialty: 'Culinária Vegana',
            description: 'Criatividade e sabor em pratos 100% vegetais',
            rating: 4.9,
            image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop'
        },
        {
            id: 5,
            name: 'Chef Roberto Lima',
            specialty: 'Culinária Asiática',
            description: 'Técnicas orientais e sabores exóticos autênticos',
            rating: 4.8,
            image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop'
        },
        {
            id: 6,
            name: 'Chef Fernanda Alves',
            specialty: 'Sobremesas',
            description: 'Doces e sobremesas artesanais que encantam',
            rating: 5.0,
            image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=400&fit=crop'
        },
        {
            id: 7,
            name: 'Chef Pedro Mendes',
            specialty: 'Churrasco',
            description: 'Cortes especiais e técnicas de churrasco perfeitas',
            rating: 4.8,
            image: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&h=400&fit=crop'
        },
        {
            id: 8,
            name: 'Chef Juliana Rocha',
            specialty: 'Culinária Francesa',
            description: 'Técnicas clássicas francesas com toque contemporâneo',
            rating: 4.9,
            image: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&h=400&fit=crop'
        },
        {
            id: 9,
            name: 'Chef Lucas Ferreira',
            specialty: 'Pizzas Artesanais',
            description: 'Massas fermentadas naturalmente e ingredientes premium',
            rating: 4.7,
            image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop'
        },
        {
            id: 10,
            name: 'Chef Beatriz Souza',
            specialty: 'Culinária Mediterrânea',
            description: 'Sabores frescos e saudáveis do Mediterrâneo',
            rating: 4.8,
            image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&h=400&fit=crop'
        },
        {
            id: 11,
            name: 'Chef Rafael Torres',
            specialty: 'Frutos do Mar',
            description: 'Peixes e frutos do mar frescos preparados com maestria',
            rating: 4.9,
            image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop'
        },
        {
            id: 12,
            name: 'Chef Camila Martins',
            specialty: 'Culinária Caseira',
            description: 'Receitas tradicionais com carinho e sabor de casa',
            rating: 4.8,
            image: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=400&h=400&fit=crop'
        },
    ];

    const scrollCategories = (direction: 'left' | 'right') => {
        if (categoriesRef.current) {
            const scrollAmount = 200;
            categoriesRef.current.scrollBy({
                left: direction === 'left' ? -scrollAmount : scrollAmount,
                behavior: 'smooth'
            });
        }
    };

    return (
        <>
            <Header />
            <div className="chefs-page">
                <section className="chefs-banner">
                    <div className="chefs-banner-content">
                        <h1 className="chefs-banner-title">Encontre o Chef ideal para voce</h1>
                        <div className="chefs-search-container">
                            <div className="chefs-search-box">
                                <svg className="search-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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
                                onClick={() => scrollCategories('left')}
                                aria-label="Categorias anteriores"
                            >
                                ‹
                            </button>
                            <div className="categories-scroll" ref={categoriesRef}>
                                {categories.map((category, index) => (
                                    <button key={index} className="category-chip">
                                        <span className="category-icon">{category.icon}</span>
                                        <span className="category-name">{category.name}</span>
                                    </button>
                                ))}
                            </div>
                            <button 
                                className="category-nav-btn category-nav-right" 
                                onClick={() => scrollCategories('right')}
                                aria-label="Próximas categorias"
                            >
                                ›
                            </button>
                        </div>
                    </div>
                </section>

                <section className="chefs-grid-section">
                    <div className="chefs-grid-container">
                        {chefs.map((chef) => (
                            <div key={chef.id} className="chef-card">
                                <div className="chef-card-image">
                                    <img src={chef.image} alt={chef.name} />
                                </div>
                                <div className="chef-card-info">
                                    <h3 className="chef-card-name">{chef.name}</h3>
                                    <p className="chef-card-specialty">{chef.specialty}</p>
                                    <p className="chef-card-description">{chef.description}</p>
                                    <div className="chef-card-rating">
                                        <span className="rating-value">
                                            {(() => {
                                                const rounded = Math.round(chef.rating * 2) / 2;
                                                return rounded % 1 === 0 ? rounded.toFixed(1) : rounded;
                                            })()}
                                        </span>
                                        <div className="rating-stars">
                                            {renderStars(chef.rating)}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            </div>
            <Footer />
        </>
    );
};

export default ChefsPage;

