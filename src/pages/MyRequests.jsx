import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Link, useNavigate } from 'react-router-dom';

const MyRequests = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchMyRequests = async () => {
      try {
        const token = await currentUser.getIdToken();
        const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/join-requests/my`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (!response.ok) {
          throw new Error('Failed to load join requests');
        }

        const data = await response.json();
        setRequests(data);
      } catch (err) {
        setError(err.message || 'Error loading requests');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    if (currentUser) {
      fetchMyRequests();
    }
  }, [currentUser]);

  if (loading) {
    return (
      <div className="container" style={{ textAlign: 'center', marginTop: '4rem' }}>
        <p>Loading your requests...</p>
      </div>
    );
  }

  return (
    <div className="container animate-fade-in" style={{ padding: '80px 0 40px', minHeight: '100vh' }}>
      <div style={{ marginBottom: '2rem' }}>
        <Link to="/" className="btn btn-outline btn-sm">
          &larr; Back to Home
        </Link>
      </div>

      <div className="glass" style={{ padding: '2rem', borderRadius: '12px' }}>
        <h2 style={{ marginBottom: '0.5rem', color: 'var(--primary-color)' }}>My Join Requests</h2>
        <p className="text-muted" style={{ marginBottom: '2rem' }}>Track the status of your project applications.</p>

        {error && <div className="alert error" style={{ marginBottom: '1rem' }}>{error}</div>}

        {!error && requests.length === 0 ? (
          <div className="empty-state text-center" style={{ padding: '3rem 0' }}>
            <h3>No requests found.</h3>
            <p>You haven't applied to join any projects yet.</p>
            <button className="btn btn-primary" onClick={() => navigate('/projects')} style={{ marginTop: '1rem' }}>
              Explore Projects
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {requests.map(req => (
              <div key={req._id} className="glass" style={{ padding: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderRadius: '8px', background: 'rgba(255, 255, 255, 0.03)' }}>
                <div>
                  <h3 style={{ margin: '0 0 0.5rem 0' }}>
                    <Link to={`/projects/${req.projectId._id}`} style={{ color: 'var(--text-main)', textDecoration: 'none' }}>
                      {req.projectId.title}
                    </Link>
                  </h3>
                  <div className="text-muted" style={{ fontSize: '0.9rem' }}>
                    Category: {req.projectId.category}
                  </div>
                  <div className="text-muted" style={{ fontSize: '0.85rem', marginTop: '0.25rem' }}>
                    Requested on {new Date(req.createdAt).toLocaleDateString()}
                  </div>
                </div>
                <div>
                  <span className={`status-badge ${req.status}`} style={{ textTransform: 'capitalize' }}>
                    {req.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyRequests;
