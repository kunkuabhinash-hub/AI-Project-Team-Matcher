import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { API_URL } from '../config';
import './Projects.css';

const CATEGORIES = ['All', 'Web Development', 'Mobile Development', 'AI / Machine Learning', 'Data Science', 'Cybersecurity', 'Cloud / DevOps', 'Other'];

const getCatClass = (cat) => {
  const map = {
    'Web Development': 'cat-web',
    'Mobile Development': 'cat-mobile',
    'AI / Machine Learning': 'cat-ai',
    'Data Science': 'cat-data',
    'Cybersecurity': 'cat-cyber',
    'Cloud / DevOps': 'cat-cloud',
  };
  return map[cat] || '';
};

const SkeletonCard = () => (
  <div className="project-skeleton">
    <div className="skeleton-line" style={{ height: '18px', width: '40%' }}></div>
    <div className="skeleton-line" style={{ height: '22px', width: '80%' }}></div>
    <div className="skeleton-line" style={{ height: '14px', width: '100%' }}></div>
    <div className="skeleton-line" style={{ height: '14px', width: '60%' }}></div>
    <div style={{ display: 'flex', gap: '6px', marginTop: '8px' }}>
      <div className="skeleton-line" style={{ height: '20px', width: '60px' }}></div>
      <div className="skeleton-line" style={{ height: '20px', width: '50px' }}></div>
    </div>
  </div>
);

const Projects = () => {
  const { currentUser } = useAuth();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const headers = {};
        if (currentUser) {
          const token = await currentUser.getIdToken();
          headers['Authorization'] = `Bearer ${token}`;
        }
        const response = await fetch(`${API_URL}/api/projects`, { headers });
        if (!response.ok) throw new Error('Failed to fetch projects');
        const data = await response.json();
        setProjects(data);
      } catch (err) {
        setError('Unable to load projects. Please try again.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchProjects();
  }, [currentUser]);

  const filteredProjects = useMemo(() => {
    return projects.filter(project => {
      const matchCategory = selectedCategory === 'All' || project.category === selectedCategory;
      const q = searchQuery.toLowerCase();
      const matchSearch = !q ||
        project.title.toLowerCase().includes(q) ||
        project.description.toLowerCase().includes(q) ||
        project.requiredSkills.some(s => s.toLowerCase().includes(q));
      return matchCategory && matchSearch;
    });
  }, [projects, searchQuery, selectedCategory]);

  const handleReset = () => { setSearchQuery(''); setSelectedCategory('All'); };

  return (
    <>
      <Navbar />
      <div className="container projects-page">

        {/* Header */}
        <div className="projects-page-header">
          <div>
            <h1>Explore Projects</h1>
            <p>Find projects that match your skills and interests.</p>
          </div>
          {currentUser && (
            <Link to="/create-project" className="btn btn-primary">+ New Project</Link>
          )}
        </div>

        {/* Search + Filter */}
        <div className="search-bar">
          <input
            type="text"
            placeholder="Search projects, skills, or categories..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)}>
            {CATEGORIES.map(cat => (
              <option key={cat} value={cat}>{cat === 'All' ? 'All Categories' : cat}</option>
            ))}
          </select>
          {(searchQuery || selectedCategory !== 'All') && (
            <button className="btn btn-outline btn-sm" onClick={handleReset}>Reset</button>
          )}
        </div>

        {/* Error */}
        {error && <div className="alert alert-error">{error}</div>}

        {/* Loading Skeletons */}
        {loading && (
          <div className="projects-grid">
            {[...Array(6)].map((_, i) => <SkeletonCard key={i} />)}
          </div>
        )}

        {/* Empty States */}
        {!loading && !error && projects.length === 0 && (
          <div className="empty-state" style={{ border: '1px dashed var(--border)', borderRadius: 'var(--r-xl)' }}>
            <div className="empty-state-icon">📁</div>
            <h3>No projects yet</h3>
            <p>Be the first to share a project idea and find your team.</p>
            {currentUser ? (
              <Link to="/create-project" className="btn btn-primary" style={{ marginTop: '12px' }}>Create the first project</Link>
            ) : (
              <Link to="/signup" className="btn btn-primary" style={{ marginTop: '12px' }}>Get started</Link>
            )}
          </div>
        )}

        {!loading && !error && projects.length > 0 && filteredProjects.length === 0 && (
          <div className="empty-state" style={{ border: '1px dashed var(--border)', borderRadius: 'var(--r-xl)' }}>
            <div className="empty-state-icon">🔍</div>
            <h3>No projects match your search</h3>
            <p>Try different keywords or remove filters.</p>
            <button className="btn btn-secondary" onClick={handleReset} style={{ marginTop: '12px' }}>Clear filters</button>
          </div>
        )}

        {/* Grid */}
        {!loading && !error && filteredProjects.length > 0 && (
          <>
            {searchQuery || selectedCategory !== 'All' ? (
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '16px' }}>
                {filteredProjects.length} project{filteredProjects.length !== 1 ? 's' : ''} found
              </p>
            ) : null}
            <div className="projects-grid">
              {filteredProjects.map((project) => (
                <div key={project._id} className="project-card" onClick={() => {}}>
                  <div className="project-card-top">
                    <span className={`cat-badge ${getCatClass(project.category)}`}>{project.category}</span>
                    <span className="project-date-text">
                      {new Date(project.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </span>
                  </div>

                  <h3 className="project-card-title">{project.title}</h3>
                  <p className="project-card-desc">{project.description}</p>

                  <div className="project-card-skills">
                    {project.requiredSkills.slice(0, 4).map((skill, i) => (
                      <span key={i} className="skill-tag">{skill}</span>
                    ))}
                    {project.requiredSkills.length > 4 && (
                      <span className="skill-tag">+{project.requiredSkills.length - 4}</span>
                    )}
                  </div>

                  <div className="project-card-meta">
                    <span className="project-meta-item">
                      <span className="project-meta-icon">👥</span>
                      {project.teamSize} members
                    </span>
                    {project.duration && (
                      <span className="project-meta-item">
                        <span className="project-meta-icon">⏱</span>
                        {project.duration}
                      </span>
                    )}
                  </div>

                  <div className="project-card-footer">
                    <span className="project-creator">by {project.creatorName}</span>
                    <Link to={`/projects/${project._id}`} className="project-view-link">
                      View →
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </>
  );
};

export default Projects;
