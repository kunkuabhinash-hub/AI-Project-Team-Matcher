import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './Hero.css';

const Hero = () => {
  const navigate = useNavigate();
  const { currentUser, loading } = useAuth();

  if (loading) {
    return <section className="hero"><div className="hero-background"><div className="blob blob-1"></div><div className="blob blob-2"></div></div></section>;
  }
  return (
    <section className="hero">
      <div className="hero-background">
        <div className="blob blob-1"></div>
        <div className="blob blob-2"></div>
      </div>
      
      <div className="container hero-content animate-fade-in">
        <span className="badge">AI-Powered Teambuilding</span>
        
        {currentUser ? (
          <>
            <h1 className="hero-title">
              Hi, <span className="highlight">{currentUser.displayName || currentUser.email || 'Student'}</span>! 👋
            </h1>
            <p className="hero-subtitle">
              Ready to find your next project team?
            </p>
            <div className="hero-actions" style={{ flexWrap: 'wrap', justifyContent: 'center' }}>
              <button className="btn btn-primary btn-large" onClick={() => navigate('/projects')}>Find Projects</button>
              <button className="btn btn-outline btn-large" onClick={() => navigate('/create-project')}>Create Project</button>
              <button className="btn btn-outline btn-large" onClick={() => navigate('/profile')}>My Profile</button>
            </div>
          </>
        ) : (
          <>
            <h1 className="hero-title">
              Find Your Perfect<br/>
              <span className="highlight">Project Team</span>
            </h1>
            <p className="hero-subtitle">
              Join the ultimate platform for college students. Create profiles, showcase your skills, and let our AI match you with the right teammates to bring your ideas to life.
            </p>
            <div className="hero-actions" style={{ flexWrap: 'wrap', justifyContent: 'center' }}>
              <button className="btn btn-primary btn-large" onClick={() => navigate('/signup')}>Get Started Now</button>
              <button className="btn btn-outline btn-large" onClick={() => navigate('/projects')}>Explore Projects</button>
              <button className="btn btn-outline btn-large" onClick={() => navigate('/login')}>Login</button>
            </div>
          </>
        )}
      </div>
    </section>
  );
};

export default Hero;
