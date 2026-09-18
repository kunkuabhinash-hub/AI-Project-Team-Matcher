import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './Dashboard.css';

const Dashboard = () => {
  const [error, setError] = useState('');
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();

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
          <h2>Welcome, {currentUser?.displayName || 'Student'}!</h2>
          <p>You have successfully authenticated using Firebase.</p>
          <div className="status-badge success">Authentication Active</div>
        </div>

        <div className="dashboard-content">
          <div className="placeholder-card glass">
            <h3>Find a Project</h3>
            <p>AI matchmaking features will be available in future steps.</p>
            <button className="btn btn-primary disabled" disabled>Coming Soon</button>
          </div>
          
          <div className="placeholder-card glass">
            <h3>Your Profile</h3>
            <p>Student profile and skills setup will be available in future steps.</p>
            <button className="btn btn-primary disabled" disabled>Coming Soon</button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
