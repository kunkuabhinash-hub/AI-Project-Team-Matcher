import React from 'react';
import './Hero.css';

const Hero = () => {
  return (
    <section className="hero">
      <div className="hero-background">
        <div className="blob blob-1"></div>
        <div className="blob blob-2"></div>
      </div>
      
      <div className="container hero-content animate-fade-in">
        <span className="badge">AI-Powered Teambuilding</span>
        <h1 className="hero-title">
          Find Your Perfect<br/>
          <span className="highlight">Project Team</span>
        </h1>
        <p className="hero-subtitle">
          Join the ultimate platform for college students. Create profiles, showcase your skills, and let our AI match you with the right teammates to bring your ideas to life.
        </p>
        <div className="hero-actions">
          <button className="btn btn-primary btn-large">Get Started Now</button>
          <button className="btn btn-outline btn-large">Explore Projects</button>
        </div>
      </div>
    </section>
  );
};

export default Hero;
