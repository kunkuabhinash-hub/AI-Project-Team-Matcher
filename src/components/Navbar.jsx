import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './Navbar.css';

const Navbar = () => {
  const location = useLocation();
  const { currentUser, loading, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
      setMobileOpen(false);
    } catch (err) {
      console.error('Failed to log out', err);
    }
  };

  const isActive = (path) => location.pathname === path ? 'active' : '';
  const closeMobile = () => setMobileOpen(false);

  return (
    <header className="navbar">
      <div className="container navbar-inner">

        {/* Logo */}
        <Link to="/" className="navbar-logo" onClick={closeMobile}>
          <div className="logo-mark">T</div>
          <span className="logo-text">Team<span>Matcher</span></span>
        </Link>

        {/* Desktop Nav */}
        {!loading && (
          <>
            <nav className="navbar-nav">
              {currentUser ? (
                <>
                  <Link to="/"               className={`nav-link ${isActive('/')}`}>Home</Link>
                  <Link to="/projects"       className={`nav-link ${isActive('/projects')}`}>Explore Projects</Link>
                  <Link to="/my-projects"    className={`nav-link ${isActive('/my-projects')}`}>My Projects</Link>
                  <Link to="/my-teams"       className={`nav-link ${isActive('/my-teams')}`}>My Teams</Link>
                  <Link to="/create-project" className={`nav-link ${isActive('/create-project')}`}>Create Project</Link>
                  <Link to="/my-requests"    className={`nav-link ${isActive('/my-requests')}`}>My Requests</Link>
                  <Link to="/my-invitations" className={`nav-link ${isActive('/my-invitations')}`}>My Invitations</Link>
                  <Link to="/profile"        className={`nav-link ${isActive('/profile')}`}>Profile</Link>
                </>
              ) : (
                <>
                  <Link to="/"         className={`nav-link ${isActive('/')}`}>Home</Link>
                  <Link to="/projects" className={`nav-link ${isActive('/projects')}`}>Explore Projects</Link>
                </>
              )}
            </nav>

            <div className="navbar-actions">
              {currentUser ? (
                <button className="btn btn-secondary" onClick={handleLogout}>Sign out</button>
              ) : (
                <>
                  <Link to="/login"  className="btn btn-secondary">Log in</Link>
                  <Link to="/signup" className="btn btn-primary">Sign up</Link>
                </>
              )}
            </div>

            {/* Mobile toggle */}
            <button
              className="nav-mobile-toggle"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label="Toggle menu"
            >
              <div className={`hamburger ${mobileOpen ? 'open' : ''}`}>
                <span></span>
                <span></span>
                <span></span>
              </div>
            </button>
          </>
        )}
      </div>

      {/* Mobile Menu */}
      {mobileOpen && !loading && (
        <div className="mobile-menu">
          <div className="mobile-menu-links">
            {currentUser ? (
              <>
                <Link to="/"               className={`mobile-nav-link ${isActive('/')}`}               onClick={closeMobile}>Home</Link>
                <Link to="/projects"       className={`mobile-nav-link ${isActive('/projects')}`}       onClick={closeMobile}>Explore Projects</Link>
                <Link to="/my-projects"    className={`mobile-nav-link ${isActive('/my-projects')}`}    onClick={closeMobile}>My Projects</Link>
                <Link to="/my-teams"       className={`mobile-nav-link ${isActive('/my-teams')}`}       onClick={closeMobile}>My Teams</Link>
                <Link to="/create-project" className={`mobile-nav-link ${isActive('/create-project')}`} onClick={closeMobile}>Create Project</Link>
                <Link to="/my-requests"    className={`mobile-nav-link ${isActive('/my-requests')}`}    onClick={closeMobile}>My Requests</Link>
                <Link to="/my-invitations" className={`mobile-nav-link ${isActive('/my-invitations')}`} onClick={closeMobile}>My Invitations</Link>
                <Link to="/profile"        className={`mobile-nav-link ${isActive('/profile')}`}        onClick={closeMobile}>Profile</Link>
              </>
            ) : (
              <>
                <Link to="/"         className={`mobile-nav-link ${isActive('/')}`}         onClick={closeMobile}>Home</Link>
                <Link to="/projects" className={`mobile-nav-link ${isActive('/projects')}`} onClick={closeMobile}>Explore Projects</Link>
              </>
            )}
          </div>
          <div className="mobile-menu-actions">
            {currentUser ? (
              <button className="btn btn-secondary" onClick={handleLogout}>Sign out</button>
            ) : (
              <>
                <Link to="/login"  className="btn btn-secondary" onClick={closeMobile}>Log in</Link>
                <Link to="/signup" className="btn btn-primary"   onClick={closeMobile}>Sign up</Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;
