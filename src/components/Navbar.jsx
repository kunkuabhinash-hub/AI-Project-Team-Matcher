import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './Navbar.css';

const Navbar = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  return (
    <header className="navbar glass">
      <div className="container navbar-container">
        <Link to="/" className="navbar-logo">
          <span className="logo-icon">✨</span>
          <h1>TeamMatcher AI</h1>
        </Link>
        <nav className="navbar-links">
          <a href="#features">Features</a>
          <a href="#how-it-works">How it Works</a>
        </nav>
        <div className="navbar-actions">
          {currentUser ? (
            <button className="btn btn-primary" onClick={() => navigate('/dashboard')}>
              Dashboard
            </button>
          ) : (
            <>
              <button className="btn btn-outline" onClick={() => navigate('/login')}>Log In</button>
              <button className="btn btn-primary" onClick={() => navigate('/signup')}>Sign Up</button>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
