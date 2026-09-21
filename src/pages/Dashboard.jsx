import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './Dashboard.css';

const Dashboard = () => {
  const [error, setError] = useState('');
  const [completionPercent, setCompletionPercent] = useState(0);
  const [myProjects, setMyProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const token = await currentUser.getIdToken();
        
        // Fetch Profile
        const profileRes = await fetch('http://localhost:5000/api/profile', {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (profileRes.ok) {
          const profileData = await profileRes.json();
          calculateCompletion(profileData);
        }

        // Fetch Projects
        const projectsRes = await fetch('http://localhost:5000/api/projects', {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (projectsRes.ok) {
          const allProjects = await projectsRes.json();
          const userProjects = allProjects.filter(p => p.creatorFirebaseUid === currentUser.uid);
          setMyProjects(userProjects);
        }
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };

    if (currentUser) {
      fetchDashboardData();
    }
  }, [currentUser]);

  const calculateCompletion = (data) => {
    const fields = ['fullName', 'collegeEmail', 'department', 'year', 'skills', 'interests', 'experience', 'availability'];
    let filled = 0;
    
    fields.forEach(field => {
      if (Array.isArray(data[field]) && data[field].length > 0) filled++;
      else if (typeof data[field] === 'string' && data[field].trim() !== '') filled++;
    });

    setCompletionPercent(Math.round((filled / fields.length) * 100));
  };

  const handleLogout = async () => {
    setError('');
    try {
      await logout();
      navigate('/login');
    } catch (err) {
      setError('Failed to log out. Please try again.');
    }
  };

  return (
    <div className="dashboard-container">
      <header className="dashboard-header glass">
        <div className="container dashboard-nav">
          <div className="navbar-logo">
            <span className="logo-icon">✨</span>
            <h1>TeamMatcher AI</h1>
          </div>
          <div className="user-profile">
            <span className="user-email">{currentUser?.email}</span>
            <button className="btn btn-outline btn-sm" onClick={handleLogout}>
              Log Out
            </button>
          </div>
        </div>
      </header>

      <main className="container dashboard-main animate-fade-in">
        {error && <div className="error-alert">{error}</div>}
        
        <div className="welcome-card glass">
          <h2>Welcome to your Workspace, {currentUser?.displayName || 'Student'}!</h2>
          <p>This is your personal dashboard to manage your profile and projects.</p>
        </div>

        <div className="dashboard-content" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginTop: '2rem' }}>
          
          <div className="dashboard-column">
            <h3>Your Profile Status</h3>
            <div className="placeholder-card glass" style={{ marginBottom: '1.5rem' }}>
              <div style={{ marginBottom: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span>Completion</span>
                  <span>{loading ? '...' : `${completionPercent}%`}</span>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.1)', height: '8px', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ background: 'var(--primary-color)', height: '100%', width: `${completionPercent}%`, transition: 'width 0.5s' }}></div>
                </div>
              </div>
              <p>Complete your student profile and skills setup to get better AI matches.</p>
              <button className="btn btn-primary" onClick={() => navigate('/profile')}>Edit Profile</button>
            </div>

            <h3>Quick Actions</h3>
            <div className="placeholder-card glass" style={{ display: 'flex', gap: '1rem' }}>
              <button className="btn btn-primary" onClick={() => navigate('/create-project')} style={{ flex: 1 }}>Create Project</button>
              <button className="btn btn-outline" onClick={() => navigate('/projects')} style={{ flex: 1 }}>Explore Projects</button>
            </div>
          </div>

          <div className="dashboard-column">
            <h3>Your Projects</h3>
            {loading ? (
              <p>Loading your projects...</p>
            ) : myProjects.length === 0 ? (
              <div className="placeholder-card glass text-center">
                <p>You haven't created any projects yet.</p>
                <button className="btn btn-primary btn-sm" onClick={() => navigate('/create-project')} style={{ marginTop: '1rem' }}>Share an Idea</button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {myProjects.map(project => (
                  <div key={project._id} className="placeholder-card glass" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <h4 style={{ margin: '0 0 0.25rem 0', color: 'var(--text-main)' }}>{project.title}</h4>
                      <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Created {new Date(project.createdAt).toLocaleDateString()}</span>
                    </div>
                    <button className="btn btn-outline btn-sm" onClick={() => navigate(`/projects/${project._id}`)}>View</button>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </main>
    </div>
  );
};

export default Dashboard;
