import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Hero from '../components/Hero';
import './Home.css';

/* ── Scroll Reveal Hook ──────────────────────────────────────── */
const useReveal = () => {
  useEffect(() => {
    const els = document.querySelectorAll('.reveal');
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
    );
    els.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);
};

/* ── Coverage bar animates when visible ─────────────────────── */
const useCoverageAnimate = (ref) => {
  const [animate, setAnimate] = useState(false);
  useEffect(() => {
    if (!ref.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setAnimate(true); observer.disconnect(); } },
      { threshold: 0.3 }
    );
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [ref]);
  return animate;
};

/* ── Section: How It Works ───────────────────────────────────── */
const STEPS = [
  {
    num: '01',
    icon: '📝',
    iconBg: 'rgba(56,139,253,0.12)',
    title: 'Create a Project',
    desc: 'Describe your idea, list the required skills, and set your desired team size.',
  },
  {
    num: '02',
    icon: '🔍',
    iconBg: 'rgba(63,185,80,0.12)',
    title: 'Discover',
    desc: 'Explore open projects and opportunities that match your interests.',
  },
  {
    num: '03',
    icon: '✦',
    iconBg: 'rgba(163,113,247,0.12)',
    title: 'AI Match',
    desc: 'Receive teammate recommendations based on skills, interests, and experience.',
  },
  {
    num: '04',
    icon: '👥',
    iconBg: 'rgba(210,153,34,0.12)',
    title: 'Build Your Team',
    desc: 'Select suitable students and form your project team.',
  },
];

const HowItWorksSection = () => (
  <section className="home-section how-it-works">
    <div className="container">
      <div className="how-it-works-header reveal">
        <div className="home-section-label">Process</div>
        <h2 className="home-section-heading">How TeamMatcher Works</h2>
        <p className="home-section-sub">
          Turn your project idea into a capable team in four simple steps.
        </p>
      </div>

      <div className="steps-track">
        {STEPS.map((step, i) => (
          <div
            key={step.num}
            className={`step-item reveal reveal-delay-${i + 1}`}
          >
            <div className="step-number-row">
              <div className="step-number">{step.num}</div>
              {i < STEPS.length - 1 && <div className="step-connector" />}
            </div>
            <div className="step-icon" style={{ background: step.iconBg }}>
              {step.icon}
            </div>
            <div className="step-title">{step.title}</div>
            <p className="step-desc">{step.desc}</p>
          </div>
        ))}
      </div>
    </div>
  </section>
);

/* ── Section: Why TeamMatcher ────────────────────────────────── */
const WHY_FEATURES = [
  {
    icon: '🎯',
    iconBg: 'rgba(56,139,253,0.12)',
    title: 'Skills',
    desc: 'Match project requirements with student skills. No guesswork, no generic search.',
  },
  {
    icon: '✦',
    iconBg: 'rgba(163,113,247,0.12)',
    title: 'AI Insights',
    desc: 'Understand why a student matches your project — with concrete, reasoned explanations.',
  },
  {
    icon: '📊',
    iconBg: 'rgba(63,185,80,0.12)',
    title: 'Team Coverage',
    desc: 'See which required skills your team covers and exactly where gaps remain.',
  },
];

const WhySection = () => (
  <section className="home-section why-section">
    <div className="container">
      <div className="why-layout">
        {/* Left: features */}
        <div>
          <div className="reveal">
            <div className="home-section-label">Why TeamMatcher</div>
            <h2 className="home-section-heading">
              Build teams based on<br />more than just availability.
            </h2>
          </div>

          <div className="why-features" style={{ marginTop: '36px' }}>
            {WHY_FEATURES.map((f, i) => (
              <div key={f.title} className={`why-feature reveal reveal-delay-${i + 1}`}>
                <div className="why-feature-icon" style={{ background: f.iconBg }}>
                  {f.icon}
                </div>
                <div className="why-feature-content">
                  <div className="why-feature-title">{f.title}</div>
                  <p className="why-feature-desc">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: decorative project card */}
        <div className="why-visual reveal">
          <div className="why-card">
            <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--blue)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>
              AI / Machine Learning
            </div>
            <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '10px' }}>
              Smart Study Assistant
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '6px' }}>Required skills</div>
            <div className="skills-list" style={{ marginBottom: '16px' }}>
              {['Python', 'React', 'MongoDB', 'FastAPI'].map(s => (
                <span key={s} className="skill-tag skill-tag-blue">{s}</span>
              ))}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--text-muted)', paddingTop: '12px', borderTop: '1px solid var(--border)' }}>
              <span>👥 4 members</span>
              <span>⏱ 3 Months</span>
            </div>
          </div>

          <div className="why-card" style={{ background: 'rgba(163,113,247,0.04)', borderColor: 'var(--purple-border)' }}>
            <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--purple)', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span>✦</span> AI Recommendations
            </div>
            {[{ name: 'Arjun S.', score: 92, color: 'var(--green)' }, { name: 'Priya K.', score: 74, color: 'var(--amber)' }].map(r => (
              <div key={r.name} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 0', borderBottom: '1px solid var(--border-muted)' }}>
                <div style={{ width: 26, height: 26, borderRadius: '50%', background: 'var(--surface-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', flexShrink: 0 }}>{r.name[0]}</div>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', flex: 1 }}>{r.name}</div>
                <span style={{ fontSize: 12, fontWeight: 700, color: r.color }}>{r.score}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  </section>
);

/* ── Section: AI Matching Visualization ──────────────────────── */
const AiMatchSection = () => {
  const coverageRef = useRef(null);
  const animate = useCoverageAnimate(coverageRef);

  return (
    <section className="home-section ai-section">
      <div className="container">
        <div className="ai-section-layout">
          {/* Left: copy */}
          <div className="reveal">
            <div className="home-section-label">AI Matching</div>
            <h2 className="home-section-heading">
              Meet teammates who<br />fit your project.
            </h2>
            <p className="home-section-sub" style={{ marginTop: '14px' }}>
              AI analyzes project requirements and student profiles to identify compatible teammates and explain the match.
            </p>
          </div>

          {/* Right: visualization (purely decorative) */}
          <div className="ai-viz">
            {/* Project Requirements */}
            <div className="ai-viz-card reveal reveal-delay-1">
              <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '6px' }}>
                Project Requirements
              </div>
              <div className="ai-viz-req-row">
                {['Python', 'React', 'MongoDB'].map(s => (
                  <span key={s} className="skill-tag skill-tag-blue">{s}</span>
                ))}
              </div>
            </div>

            {/* AI badge connector */}
            <div className="ai-viz-connector reveal reveal-delay-2" style={{ flexDirection: 'column' }}>
              <div className="ai-viz-arrow-line" style={{ width: '100%', height: '1px', background: 'linear-gradient(90deg, transparent, var(--purple), transparent)' }}></div>
              <div style={{ display: 'flex', justifyContent: 'center', margin: '4px 0' }}>
                <div className="ai-viz-badge">✦ AI MATCHING</div>
              </div>
              <div className="ai-viz-arrow-line" style={{ width: '100%', height: '1px', background: 'linear-gradient(90deg, transparent, var(--purple), transparent)' }}></div>
            </div>

            {/* Recommendations */}
            <div className="ai-viz-recs reveal reveal-delay-3">
              <div className="ai-viz-rec">
                <div className="ai-viz-rec-avatar" style={{ background: 'rgba(56,139,253,0.12)', color: 'var(--blue)' }}>A</div>
                <div className="ai-viz-rec-name">Arjun S.</div>
                <span className="ai-viz-rec-score score-high">92% match</span>
              </div>
              <div className="ai-viz-rec">
                <div className="ai-viz-rec-avatar" style={{ background: 'rgba(163,113,247,0.12)', color: 'var(--purple)' }}>P</div>
                <div className="ai-viz-rec-name">Priya K.</div>
                <span className="ai-viz-rec-score score-medium">87% match</span>
              </div>
            </div>

            {/* Coverage */}
            <div className="ai-viz-card ai-viz-coverage reveal reveal-delay-4" ref={coverageRef}>
              <div className="ai-viz-coverage-header">
                <span>Team Skill Coverage</span>
                <span className="ai-viz-coverage-pct">67%</span>
              </div>
              <div className="ai-viz-coverage-track">
                <div className={`ai-viz-coverage-fill ${animate ? 'animate' : ''}`}></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

/* ── Section: CTA ────────────────────────────────────────────── */
const CtaSection = () => (
  <section className="home-section cta-section">
    <div className="container">
      <div className="cta-inner reveal">
        <div className="cta-copy">
          <h2 className="cta-heading">Have a project idea?</h2>
          <p className="cta-sub">Find the people who can help you build it.</p>
        </div>
        <div className="cta-actions">
          <Link to="/signup"   className="btn btn-primary btn-lg">Create a Project</Link>
          <Link to="/projects" className="btn btn-secondary btn-lg">Explore Projects</Link>
        </div>
      </div>
    </div>
  </section>
);

/* ── Footer ──────────────────────────────────────────────────── */
const HomeFooter = () => (
  <footer className="home-footer">
    <div className="container footer-inner">
      <div className="footer-brand">
        <Link to="/" className="footer-logo-row" style={{ textDecoration: 'none', color: 'inherit' }}>
          <div className="footer-logo-mark">T</div>
          <span className="footer-logo-text">TeamMatcher</span>
        </Link>
        <p className="footer-tagline">Build better teams. Build better projects.</p>
      </div>

      <nav className="footer-links">
        <Link to="/projects"       className="footer-link">Projects</Link>
        <Link to="/create-project" className="footer-link">Create Project</Link>
        <Link to="/profile"        className="footer-link">Profile</Link>
      </nav>

      <p className="footer-copy">
        © {new Date().getFullYear()} TeamMatcher
      </p>
    </div>
  </footer>
);

/* ── Home Page ───────────────────────────────────────────────── */
const Home = () => {
  useReveal();

  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <HowItWorksSection />
        <WhySection />
        <AiMatchSection />
        <CtaSection />
      </main>
      <HomeFooter />
    </>
  );
};

export default Home;
