import React from "react";
import facebookIcon from "../assets/facebook.svg";
import instagramIcon from "../assets/instagram.svg";

const Footer: React.FC = () => {
  return (
    <footer className="footer">
      <div className="footer-logo">ChefNow</div>
      <div className="footer-copyright">
        © 2025 ChefNow. Todos os direitos reservados.
      </div>
      <div className="footer-social">
        <div className="social-icons">
          <a
            href="https://www.facebook.com/?locale=pt_BR"
            className="social-icon"
          >
            <img src={facebookIcon} alt="Facebook" />
          </a>
          <a href="https://www.instagram.com" className="social-icon">
            <img src={instagramIcon} alt="Instagram" />
          </a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
