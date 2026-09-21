import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import './MyRequests.css';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const MyRequests = () => {
  const { currentUser } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchMyRequests = async () => {
      try {
        const token = await currentUser.getIdToken();
        const res = await fetch(`${API}/api/join-requests/my`, { headers: { Authorization: `Bearer ${token}` } });
        if (!res.ok) throw new Error('Failed to load join requests');
        setRequests(await res.json());
      } catch (err) {
        setError(err.message || 'Error loading requests');
      } finally {
        setLoading(false);
      }
    };
    if (currentUser) fetchMyRequests();
  }, [currentUser]);

  return (
    <>
      <Navbar />
      <div className="container my-requests-page">
        <div className="my-requests-page-header">
          <h1>My Requests</h1>
          <p>Track the status of your project join applications.</p>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        {loading && (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Loading your requests...</p>
          </div>
        )}

        {!loading && !error && requests.length === 0 && (
          <div className="empty-state" style={{ border: '1px dashed var(--border)', borderRadius: 'var(--r-xl)' }}>
            <div className="empty-state-icon">📬</div>
            <h3>No requests yet</h3>
            <p>You haven't applied to join any projects. Browse open projects and find something interesting.</p>
            <Link to="/projects" className="btn btn-primary" style={{ marginTop: '12px' }}>Explore Projects</Link>
          </div>
        )}

        {!loading && !error && requests.length > 0 && (
          <div className="requests-feed">
            {requests.map(req => (
              <div key={req._id} className={`request-feed-item status-${req.status}`}>
                <div className="request-feed-body">
                  <Link to={`/projects/${req.projectId._id}`} className="request-project-link">
                    {req.projectId.title}
                  </Link>
                  <div className="request-project-category">{req.projectId.category}</div>
                  <div className="request-project-date">
                    Requested {new Date(req.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                  </div>
                </div>
                <div className="request-feed-status">
                  <span className={`status-badge ${req.status}`} style={{ textTransform: 'capitalize' }}>
                    {req.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
};

export default MyRequests;
