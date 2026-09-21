import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './Navbar.css';

const Navbar = () => {
  const navigate = useNavigate();
  const { currentUser, loading, logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (err) {
      console.error('Failed to log out', err);
    }
  };

  return (
    <header className="navbar glass">
      <div className="container navbar-container">
        <Link to="/" className="navbar-logo">
          <span className="logo-icon">✨</span>
          <h1>TeamMatcher AI</h1>
        </Link>
        
        {!loading && (
          <>
            <nav className="navbar-links">
              {!currentUser && (
                <>
                  <a href="#features">Features</a>
                  <a href="#how-it-works">How it Works</a>
                  <Link to="/projects">Browse Projects</Link>
                </>
              )}
            </nav>
            <div className="navbar-actions">
              {currentUser ? (
                <>
                  <button className="btn btn-outline" onClick={() => navigate('/projects')}>
                    Projects
                  </button>
                  <button className="btn btn-outline" onClick={() => navigate('/create-project')}>
                    Create Project
                  </button>
                  <button className="btn btn-outline" onClick={() => navigate('/my-requests')}>
                    My Requests
                  </button>
                  <button className="btn btn-outline" onClick={() => navigate('/profile')}>
                    Profile
                  </button>
                  <button className="btn btn-primary" onClick={handleLogout}>
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <button className="btn btn-outline" onClick={() => navigate('/login')}>Log In</button>
                  <button className="btn btn-primary" onClick={() => navigate('/signup')}>Sign Up</button>
                </>
              )}
            </div>
          </>
        )}
      </div>
    </header>
  );
};

export default Navbar;
