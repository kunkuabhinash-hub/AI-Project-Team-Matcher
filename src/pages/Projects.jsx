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

const Projects = ({ myProjectsMode = false }) => {
  const { currentUser } = useAuth();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  const [myTeamProjectIds, setMyTeamProjectIds] = useState([]);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const headers = {};
        if (currentUser) {
          const token = await currentUser.getIdToken();
          headers['Authorization'] = `Bearer ${token}`;
          
          if (!myProjectsMode) {
            try {
              const mtRes = await fetch(`${API_URL}/api/my-teams`, { headers });
              if (mtRes.ok) {
                const mtData = await mtRes.json();
                setMyTeamProjectIds(mtData.map(t => t.projectId || t._id));
              }
            } catch (e) {
              console.error('Failed to fetch my teams', e);
            }
          }
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
  }, [currentUser, myProjectsMode]);

  const finalFilteredProjects = useMemo(() => {
    const filtered = projects.filter(project => {
      const matchCategory = selectedCategory === 'All' || project.category === selectedCategory;
      const q = searchQuery.toLowerCase();
      const matchSearch = !q ||
        project.title.toLowerCase().includes(q) ||
        project.description.toLowerCase().includes(q) ||
        project.requiredSkills.some(s => s.toLowerCase().includes(q));
      return matchCategory && matchSearch;
    });

    return filtered.filter(project => {
      const isOwner = currentUser && project.creatorFirebaseUid === currentUser.uid;
      const isTeamMember = myTeamProjectIds.includes(project._id);
      return myProjectsMode ? isOwner : (!isOwner && !isTeamMember);
    });
  }, [projects, searchQuery, selectedCategory, currentUser, myProjectsMode, myTeamProjectIds]);

  const handleReset = () => { setSearchQuery(''); setSelectedCategory('All'); };

  const renderProjectGrid = (projectList) => (
    <div className="projects-grid">
      {projectList.map((project) => (
        <div key={project._id} className="project-card" onClick={() => {}}>
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

          <div className="project-card-skills" style={{ marginTop: '16px' }}>
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
  );

  return (
    <>
      <Navbar />
      <div className="container projects-page">

        {/* Header */}
        <div className="projects-page-header">
          <div>
            <h1>{myProjectsMode ? 'My Projects' : 'Explore Projects'}</h1>
            <p>{myProjectsMode ? 'Manage projects you have created.' : 'Find projects that match your skills and interests.'}</p>
          </div>
          {currentUser && !myProjectsMode && (
            <Link to="/create-project" className="btn btn-primary">+ New Project</Link>
          )}
          {myProjectsMode && (
            <Link to="/create-project" className="btn btn-primary">+ Create Project</Link>
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

        {/* Display Logic based on myProjectsMode */}
        {!loading && !error && (
          <div>
            {finalFilteredProjects.length > 0 ? (
              <>
                {(searchQuery || selectedCategory !== 'All') && (
                  <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '16px' }}>
                    {finalFilteredProjects.length} project{finalFilteredProjects.length !== 1 ? 's' : ''} found
                  </p>
                )}
                {renderProjectGrid(finalFilteredProjects)}
              </>
            ) : projects.length === 0 ? (
              // Case: No projects in database at all (for both modes)
              <div className="empty-state" style={{ padding: '24px', border: '1px dashed var(--border)', borderRadius: 'var(--r-lg)' }}>
                <div className="empty-state-icon">📁</div>
                <h3>{myProjectsMode ? 'You haven\'t created any projects yet' : 'No projects yet'}</h3>
                <p>{myProjectsMode ? 'Create a project to start finding teammates.' : 'Be the first to share a project idea and find your team.'}</p>
                <Link to="/create-project" className="btn btn-primary btn-sm" style={{ marginTop: '12px' }}>+ Create Project</Link>
              </div>
            ) : myProjectsMode && projects.filter(p => currentUser && p.creatorFirebaseUid === currentUser.uid).length === 0 ? (
              // Case: User owns no projects (My Projects mode)
              <div className="empty-state" style={{ padding: '24px', border: '1px dashed var(--border)', borderRadius: 'var(--r-lg)' }}>
                <div className="empty-state-icon">📁</div>
                <h3>You haven't created any projects yet</h3>
                <p>Create a project to start finding teammates.</p>
                <Link to="/create-project" className="btn btn-primary btn-sm" style={{ marginTop: '12px' }}>+ Create Project</Link>
              </div>
            ) : !myProjectsMode && projects.filter(p => !currentUser || p.creatorFirebaseUid !== currentUser.uid).length === 0 ? (
               // Case: No projects by others (Explore mode)
               <div className="empty-state" style={{ padding: '24px', border: '1px dashed var(--border)', borderRadius: 'var(--r-lg)' }}>
                 <div className="empty-state-icon">📁</div>
                 <h3>No projects available to explore</h3>
                 <p>Check back later for new projects from other students.</p>
               </div>
            ) : (
              // Case: Projects exist but search/filter yielded 0 results
              <div className="empty-state" style={{ padding: '24px', border: '1px dashed var(--border)', borderRadius: 'var(--r-lg)' }}>
                <div className="empty-state-icon">🔍</div>
                <h3>No projects match your search</h3>
                <p>Try different keywords or remove filters.</p>
                <button className="btn btn-secondary btn-sm" onClick={handleReset} style={{ marginTop: '12px' }}>Clear filters</button>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
};


export default Projects;
