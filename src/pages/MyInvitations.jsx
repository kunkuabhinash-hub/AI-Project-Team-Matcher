import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { useAuth } from '../contexts/AuthContext';
import { API_URL as API } from '../config';

const MyInvitations = () => {
  const { currentUser } = useAuth();
  const [invitations, setInvitations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionError, setActionError] = useState('');

  useEffect(() => {
    const fetchInvitations = async () => {
      try {
        const token = await currentUser.getIdToken();
        const res = await fetch(`${API}/api/invitations/student`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (!res.ok) {
          throw new Error('Failed to fetch invitations');
        }
        
        const data = await res.json();
        setInvitations(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (currentUser) {
      fetchInvitations();
    }
  }, [currentUser]);

  const handleRespond = async (id, status) => {
    setActionError('');
    try {
      const token = await currentUser.getIdToken();
      const res = await fetch(`${API}/api/invitations/${id}/respond`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ status })
      });
      
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || `Failed to ${status} invitation`);
      }
      
      // Update state locally
      setInvitations(prev => prev.map(inv => 
        inv._id === id ? { ...inv, status } : inv
      ));
      
    } catch (err) {
      setActionError(err.message);
    }
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="container" style={{ padding: '60px 24px', textAlign: 'center' }}>
          <div className="spinner"></div>
          <p>Loading your invitations...</p>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="container" style={{ padding: '40px 24px' }}>
        <h1 style={{ marginBottom: '24px' }}>My Team Invitations</h1>
        
        {error && <div className="alert alert-error" style={{ marginBottom: '16px' }}>{error}</div>}
        {actionError && <div className="alert alert-error" style={{ marginBottom: '16px' }}>{actionError}</div>}
        
        {invitations.length === 0 ? (
          <div className="section-card" style={{ textAlign: 'center', padding: '60px 24px' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>📬</div>
            <h2>No Invitations Yet</h2>
            <p style={{ color: 'var(--text-secondary)' }}>
              You haven't received any project team invitations. Make sure your profile is complete to get noticed by project owners!
            </p>
            <Link to="/projects" className="btn btn-primary" style={{ marginTop: '20px' }}>
              Explore Projects
            </Link>
          </div>
        ) : (
          <div className="section-card">
            <div className="requests-list">
              {invitations.map(inv => (
                <div key={inv._id} className="request-item" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', borderBottom: '1px solid var(--border)', flexWrap: 'wrap', gap: '16px' }}>
                  <div className="request-info">
                    <h3 style={{ margin: '0 0 8px 0', fontSize: '18px' }}>
                      <Link to={`/projects/${inv.projectId._id}`} style={{ color: 'var(--primary-color)', textDecoration: 'none' }}>
                        {inv.projectId.title}
                      </Link>
                    </h3>
                    <div style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                      Invited by: <strong>{inv.senderName}</strong>
                    </div>
                  </div>
                  
                  <div className="request-actions" style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <span className={`status-badge ${inv.status}`}>{inv.status}</span>
                    
                    {inv.status === 'pending' && (
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button 
                          className="btn btn-sm btn-primary"
                          onClick={() => handleRespond(inv._id, 'accepted')}
                        >
                          Accept
                        </button>
                        <button 
                          className="btn btn-sm btn-danger"
                          onClick={() => handleRespond(inv._id, 'rejected')}
                        >
                          Reject
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default MyInvitations;
