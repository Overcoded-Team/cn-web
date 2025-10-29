import React from 'react';
import Header from '../components/Header';
import HeroSection from '../components/HeroSection';
import Features from '../components/Features';
import Footer from '../components/Footer';

const Hero: React.FC = () => {
    return (
        <>
            <Header />
            <HeroSection />
            <Features />
            
            <div className="cta-about-container">
                <section className="cta-section">
                    <h2>"Pronto para Transformar Seu Negócio Culinário"</h2>
                    <p>Cadastre-se e descubra como a gestão inteligente pode<br />impulsionar sua carreira.</p>
                    <a href="#criar-conta" className="btn-cta">Crie sua conta AGORA</a>
                </section>

                <section className="about">
                    <h2>Você é um artista da culinária. Sua energia deve estar no sabor, não na planilha.</h2>
                    <p>A dedicação que você coloca em cada prato não pode ser desperdiçada com o caos da gestão. O ChefNow foi criado para ser o seu sous-chef digital, cuidando de cada agendamento, pagamento e detalhe logístico.</p>
                    <p>Chegou a hora de transformar seu talento em um negócio próspero e organizado. Liberte seu tempo, maximize seus ganhos e leve sua carreira ao próximo nível. Foco total na cozinha, controle total do seu sucesso.</p>
                </section>
            </div>

            <Footer />
        </>
    );
};

export default Hero;

