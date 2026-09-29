import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { API_URL as API } from '../config';
import './Hero.css';

/* Static decorative product illustration — NOT real data */
const ProductVisualization = () => (
  <div className="hero-visual-inner">
    {/* Project Card */}
    <div className="mock-card mock-project-card">
      <div className="mock-project-label">AI / Machine Learning</div>
      <div className="mock-project-title">Smart Study Assistant</div>
      <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>
        Required skills
      </p>
      <div className="mock-skill-row">
        <span className="mock-skill">Python</span>
        <span className="mock-skill">React</span>
        <span className="mock-skill">MongoDB</span>
        <span className="mock-skill">FastAPI</span>
      </div>
    </div>

    {/* AI Connector */}
    <div className="mock-ai-connector">
      <div className="mock-ai-line"></div>
      <div className="mock-ai-badge">
        <span className="mock-ai-icon">✦</span>
        AI Matching
      </div>
      <div className="mock-ai-line"></div>
    </div>

    {/* Student Cards */}
    <div className="mock-students">
      <div className="mock-card mock-student-card">
        <div className="mock-student-header">
          <div className="mock-avatar" style={{ background: 'rgba(56,139,253,0.15)', color: 'var(--blue)' }}>A</div>
          <div className="mock-student-name">Arjun S.</div>
        </div>
        <div className="mock-score-row">
          <span className="mock-score" style={{ color: 'var(--green)' }}>92%</span>
          <div className="mock-score-bar">
            <div className="mock-score-fill" style={{ width: '92%', background: 'var(--green)' }}></div>
          </div>
        </div>
        <div className="mock-skill-row" style={{ marginTop: '6px' }}>
          <span className="mock-skill">Python</span>
          <span className="mock-skill">React</span>
        </div>
      </div>

      <div className="mock-card mock-student-card">
        <div className="mock-student-header">
          <div className="mock-avatar" style={{ background: 'rgba(163,113,247,0.15)', color: 'var(--purple)' }}>P</div>
          <div className="mock-student-name">Priya K.</div>
        </div>
        <div className="mock-score-row">
          <span className="mock-score" style={{ color: 'var(--amber)' }}>74%</span>
          <div className="mock-score-bar">
            <div className="mock-score-fill" style={{ width: '74%', background: 'var(--amber)' }}></div>
          </div>
        </div>
        <div className="mock-skill-row" style={{ marginTop: '6px' }}>
          <span className="mock-skill">MongoDB</span>
        </div>
      </div>
    </div>

    {/* Team Formed */}
    <div className="mock-card mock-team-card">
      <div className="mock-team-header">
        <div className="mock-team-title">Project Team formed</div>
        <div className="mock-team-badge">3 / 4 members</div>
      </div>
      <div className="mock-team-avatars">
        <div className="mock-avatar" style={{ background: 'rgba(56,139,253,0.15)', color: 'var(--blue)' }}>Y</div>
        <div className="mock-avatar" style={{ background: 'rgba(56,139,253,0.15)', color: 'var(--blue)' }}>A</div>
        <div className="mock-avatar" style={{ background: 'rgba(163,113,247,0.15)', color: 'var(--purple)' }}>P</div>
      </div>
    </div>
  </div>
);

const Hero = () => {
  const { currentUser, loading } = useAuth();
  const [userFullName, setUserFullName] = useState('');

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        if (!currentUser) return;
        const token = await currentUser.getIdToken();
        const profileRes = await fetch(`${API}/api/profile`, { headers: { Authorization: `Bearer ${token}` } });
        if (profileRes.ok) {
          const profileData = await profileRes.json();
          if (profileData.fullName) setUserFullName(profileData.fullName);
        }
      } catch (err) {
        console.error('Hero profile fetch error:', err);
      }
    };
    fetchProfile();
  }, [currentUser]);

  if (loading) return <section className="hero" />;

  return (
    <section className="hero">
      <div className="container hero-layout">

        {/* Left: Copy */}
        <div className="hero-copy">
          <div className="hero-eyebrow">
            <span className="hero-eyebrow-dot"></span>
            AI-Powered Team Building
          </div>

          {currentUser ? (
            <>
              <h1 className="hero-headline">
                Welcome back,<br />
                <span className="hero-headline-accent">
                  {userFullName || currentUser.displayName || 'Builder'}
                </span>
              </h1>
              <p className="hero-subtext">
                Ready to build something new? Browse open projects, review your requests, or start a new project idea.
              </p>
              <div className="hero-actions">
                <Link to="/projects"       className="btn btn-primary btn-lg">Find Projects</Link>
                <Link to="/create-project" className="btn btn-secondary btn-lg">Create Project</Link>
                <Link to="/profile"        className="btn btn-outline btn-lg">My Profile</Link>
              </div>
            </>
          ) : (
            <>
              <h1 className="hero-headline">
                Find the right teammates<br />
                <span className="hero-headline-accent">for your next project</span>
              </h1>
              <p className="hero-subtext">
                Discover projects, match skills and interests, and build teams with intelligent AI recommendations.
              </p>
              <div className="hero-actions">
                <Link to="/signup"   className="btn btn-primary btn-lg">Create a Project</Link>
                <Link to="/projects" className="btn btn-secondary btn-lg">Explore Projects</Link>
              </div>

              <div className="hero-meta">
                <div className="hero-meta-item">
                  <span className="hero-meta-value">AI</span>
                  <span className="hero-meta-label">Powered matching</span>
                </div>
                <div style={{ width: '1px', height: '32px', background: 'var(--border)' }}></div>
                <div className="hero-meta-item">
                  <span className="hero-meta-value">Skills</span>
                  <span className="hero-meta-label">Based recommendations</span>
                </div>
                <div style={{ width: '1px', height: '32px', background: 'var(--border)' }}></div>
                <div className="hero-meta-item">
                  <span className="hero-meta-value">Real</span>
                  <span className="hero-meta-label">Team formation</span>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Right: Product Visualization (decorative, static, clearly illustrative) */}
        {!currentUser && (
          <div className="hero-visual">
            <ProductVisualization />
          </div>
        )}
      </div>
    </section>
  );
};

export default Hero;
