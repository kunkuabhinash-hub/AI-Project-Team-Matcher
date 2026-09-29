import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { API_URL } from '../config';
import './Projects.css';

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

const getStatusExplanation = (status) => {
  const map = {
    'Planning': 'Project created — team formation hasn\'t started yet.',
    'Team Forming': 'Finding and forming the project team.',
    'In Progress': 'Team formed — project work can begin.',
    'Completed': 'Project completed.',
    'Cancelled': 'Project cancelled.'
  };
  return map[status] || map['Planning'];
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

const MyTeams = () => {
  const { currentUser } = useAuth();
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchMyTeams = async () => {
      try {
        const token = await currentUser.getIdToken();
        const response = await fetch(`${API_URL}/api/my-teams`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (!response.ok) throw new Error('Failed to fetch teams');
        const data = await response.json();
        setTeams(data);
      } catch (err) {
        setError('Unable to load your teams. Please try again.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    if (currentUser) fetchMyTeams();
  }, [currentUser]);

  return (
    <>
      <Navbar />
      <div className="container projects-page">
        <div className="projects-page-header">
          <div>
            <h1>My Teams</h1>
            <p>Projects you're currently working on with your team.</p>
          </div>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        {loading && (
          <div className="projects-grid">
            {[...Array(3)].map((_, i) => <SkeletonCard key={i} />)}
          </div>
        )}

        {!loading && !error && (
          <div>
            {teams.length > 0 ? (
              <div className="projects-grid">
                {teams.map((project) => (
                  <div key={project._id} className="project-card">
                    <div className="project-card-top" style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                      <span className={`cat-badge ${getCatClass(project.category)}`}>{project.category}</span>
                      <span className="project-date-text" style={{ marginLeft: 'auto' }}>
                        {new Date(project.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </span>
                    </div>

                    <h3 className="project-card-title">{project.title}</h3>
                    <p className="project-card-desc">{project.description}</p>

                    <div style={{ marginTop: '12px', padding: '10px', backgroundColor: 'var(--surface-1)', borderRadius: '6px', border: '1px solid var(--border)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                        <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>Status:</span>
                        <span className="status-badge" style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', fontSize: '11px', padding: '2px 6px', fontWeight: '500', borderRadius: '4px' }}>
                          {project.status || 'Planning'}
                        </span>
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                        {getStatusExplanation(project.status)}
                      </div>
                    </div>

                    <div className="project-card-meta" style={{ marginTop: '16px' }}>
                      <span className="project-meta-item">
                        <span className="project-meta-icon">👥</span>
                        {project.currentMembersCount} / {project.teamSize} members
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
                        Open Project →
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state" style={{ padding: '24px', border: '1px dashed var(--border)', borderRadius: 'var(--r-lg)' }}>
                <div className="empty-state-icon">👥</div>
                <h3>You are not part of any team yet.</h3>
                <p>Explore projects to find a team to join.</p>
                <Link to="/projects" className="btn btn-primary btn-sm" style={{ marginTop: '12px' }}>Explore Projects</Link>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
};

export default MyTeams;
