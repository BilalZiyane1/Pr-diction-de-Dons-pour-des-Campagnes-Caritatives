import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const Navbar = () => {
  const location = useLocation();

  const linkStyle = {
    color: '#333',               // texte gris foncé
    textDecoration: 'none',
    padding: '10px 20px',
    borderRadius: '4px',
    fontWeight: '500',
    transition: 'background-color 0.3s ease',
  };

  const activeLinkStyle = {
    backgroundColor: '#ddd',    // fond clair sur le lien actif
  };

  const navStyle = {
    display: 'flex',
    justifyContent: 'center',   // centre les liens horizontalement
    padding: '10px 0',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)', // léger ombrage sous la barre
    backgroundColor: 'transparent',
  };

  return (
    <nav style={navStyle}>
      <Link
        to="/"
        style={location.pathname === '/' ? {...linkStyle, ...activeLinkStyle} : linkStyle}
      >
        Classification
      </Link>
      <Link
        to="/predict"
        style={location.pathname === '/predict' ? {...linkStyle, ...activeLinkStyle} : linkStyle}
      >
        Predict
      </Link>
    </nav>
  );
};

export default Navbar;
