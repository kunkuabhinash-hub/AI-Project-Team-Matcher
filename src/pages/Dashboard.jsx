import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Navbar from '../components/Navbar';
import { API_URL as API } from '../config';
import './Dashboard.css';

const Dashboard = () => {
  const { currentUser } = useAuth();
  const [completionPercent, setCompletionPercent] = useState(0);
  const [myProjects, setMyProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const token = await currentUser.getIdToken();
        const profileRes = await fetch(`${API}/api/profile`, { headers: { Authorization: `Bearer ${token}` } });
        if (profileRes.ok) {
          const profileData = await profileRes.json();
          const fields = ['fullName', 'collegeEmail', 'department', 'year', 'skills', 'interests', 'experience', 'availability'];
          let filled = 0;
          fields.forEach(f => {
            if (Array.isArray(profileData[f]) && profileData[f].length > 0) filled++;
            else if (typeof profileData[f] === 'string' && profileData[f].trim()) filled++;
          });
          setCompletionPercent(Math.round((filled / fields.length) * 100));
        }
        const projectsRes = await fetch(`${API}/api/projects`, { headers: { Authorization: `Bearer ${token}` } });
        if (projectsRes.ok) {
          const all = await projectsRes.json();
          setMyProjects(all.filter(p => p.creatorFirebaseUid === currentUser.uid));
        }
      } catch (err) {
        console.error('Dashboard fetch error:', err);
      } finally {
        setLoading(false);
      }
    };
    if (currentUser) fetchDashboardData();
  }, [currentUser]);

  return (
    <>
      <Navbar />
      <div className="container dashboard-page">
        <div className="dashboard-header-section">
          <h1>Dashboard</h1>
          <p>Welcome back, {currentUser?.displayName || 'Student'}</p>
        </div>

        <div className="dashboard-grid">
          {/* Profile Card */}
          <div className="dashboard-card">
            <div className="dashboard-card-title">Profile Completion</div>
            <div className="dashboard-completion-row">
              <div className="progress-bar" style={{ flex: 1 }}>
                <div className="progress-fill" style={{ width: `${completionPercent}%` }}></div>
              </div>
              <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--blue)', flexShrink: 0 }}>
                {loading ? '—' : `${completionPercent}%`}
              </span>
            </div>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: '12px 0 16px' }}>
              Complete your profile to get better AI-powered matches.
            </p>
            <Link to="/profile" className="btn btn-secondary btn-sm">Edit Profile</Link>
          </div>

          {/* Quick Actions */}
          <div className="dashboard-card">
            <div className="dashboard-card-title">Quick Actions</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '12px' }}>
              <Link to="/create-project" className="btn btn-primary">+ Create Project</Link>
              <Link to="/projects"       className="btn btn-secondary">Explore Projects</Link>
              <Link to="/my-requests"    className="btn btn-secondary">My Requests</Link>
            </div>
          </div>

          {/* My Projects */}
          <div className="dashboard-card dashboard-card-wide">
            <div className="dashboard-card-title">Your Projects</div>
            {loading ? (
              <div className="loading-state" style={{ padding: '24px' }}>
                <div className="spinner"></div>
              </div>
            ) : myProjects.length === 0 ? (
              <div className="empty-state" style={{ padding: '32px 0' }}>
                <p>You haven't created any projects yet.</p>
                <Link to="/create-project" className="btn btn-primary" style={{ marginTop: '12px' }}>Create your first project</Link>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '12px' }}>
                {myProjects.map(project => (
                  <div key={project._id} className="dashboard-project-row">
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '14px', color: 'var(--text-primary)', marginBottom: '3px' }}>{project.title}</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                        {project.category} · Created {new Date(project.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                    <Link to={`/projects/${project._id}`} className="btn btn-secondary btn-sm">View →</Link>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default Dashboard;
