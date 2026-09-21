import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import './Projects.css';

const Projects = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Search and Filter State
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
        
        const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/projects`, {
          headers
        });

        if (!response.ok) {
          throw new Error('Failed to fetch projects');
        }

        const data = await response.json();
        setProjects(data);
      } catch (err) {
        setError('Error loading projects. Please try again later.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, [currentUser]);

  // Derived state for filtered projects
  const filteredProjects = useMemo(() => {
    return projects.filter(project => {
      const matchCategory = selectedCategory === 'All' || project.category === selectedCategory;
      
      const query = searchQuery.toLowerCase();
      const matchSearch = 
        project.title.toLowerCase().includes(query) ||
        project.description.toLowerCase().includes(query) ||
        project.requiredSkills.some(skill => skill.toLowerCase().includes(query));

      return matchCategory && matchSearch;
    });
  }, [projects, searchQuery, selectedCategory]);

  const handleReset = () => {
    setSearchQuery('');
    setSelectedCategory('All');
  };

  if (loading) {
    return (
      <div className="projects-page container">
        <div style={{ textAlign: 'center', marginTop: '4rem' }}>
          <p>Loading projects...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="projects-page container animate-fade-in">
      <div style={{ marginBottom: '2rem' }}>
        <Link to="/" className="btn btn-outline btn-sm">
          &larr; Back to Home
        </Link>
      </div>

      <div className="projects-header">
        <div>
          <h2>Discover Projects</h2>
          <p className="text-muted">Find teams looking for your skills.</p>
        </div>
        {currentUser && (
          <Link to="/create-project" className="btn btn-primary">
            + Create Project
          </Link>
        )}
      </div>

      <div className="search-filter-bar glass">
        <input 
          type="text" 
          placeholder="Search projects..." 
          className="search-input"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <select 
          className="category-filter" 
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
        >
          <option value="All">All Categories</option>
          <option value="Web Development">Web Development</option>
          <option value="Mobile Development">Mobile Development</option>
          <option value="AI / Machine Learning">AI / Machine Learning</option>
          <option value="Data Science">Data Science</option>
          <option value="Cybersecurity">Cybersecurity</option>
          <option value="Cloud / DevOps">Cloud / DevOps</option>
          <option value="Other">Other</option>
        </select>
        {(searchQuery || selectedCategory !== 'All') && (
          <button className="btn btn-outline btn-sm" onClick={handleReset}>Reset</button>
        )}
      </div>

      {error && <div className="alert error">{error}</div>}

      {!error && projects.length === 0 ? (
        <div className="glass empty-state">
          <h3>No projects have been created yet.</h3>
          <p>Be the first to share an idea and find a team!</p>
          {currentUser ? (
            <Link to="/create-project" className="btn btn-primary" style={{ marginTop: '1rem' }}>
              Create a Project
            </Link>
          ) : (
            <Link to="/login" className="btn btn-primary" style={{ marginTop: '1rem' }}>
              Log In to Create
            </Link>
          )}
        </div>
      ) : !error && filteredProjects.length === 0 ? (
        <div className="glass empty-state">
          <h3>No projects found.</h3>
          <p>Try adjusting your search or filters.</p>
          <button className="btn btn-outline" onClick={handleReset} style={{ marginTop: '1rem' }}>
            Reset Search
          </button>
        </div>
      ) : (
        <div className="projects-grid">
          {filteredProjects.map((project) => (
            <div key={project._id} className="project-card glass">
              <div className="project-card-header">
                <span className="project-category">{project.category}</span>
                <span className="project-date">
                  {new Date(project.createdAt).toLocaleDateString()}
                </span>
              </div>
              <h3 className="project-title">{project.title}</h3>
              <p className="project-description">{project.description}</p>
              
              <div className="project-details">
                <div className="detail-item">
                  <strong>Team Size:</strong> {project.teamSize} members
                </div>
                {project.duration && (
                  <div className="detail-item">
                    <strong>Duration:</strong> {project.duration}
                  </div>
                )}
                <div className="detail-item">
                  <strong>Creator:</strong> {project.creatorName}
                </div>
              </div>

              <div className="project-skills">
                <strong>Required Skills:</strong>
                <div className="skills-list">
                  {project.requiredSkills.map((skill, index) => (
                    <span key={index} className="skill-tag">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

              <button 
                className="btn btn-primary btn-sm view-btn" 
                onClick={() => navigate(`/projects/${project._id}`)}
                style={{ marginTop: '1.5rem', width: '100%' }}
              >
                View Project
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Projects;
