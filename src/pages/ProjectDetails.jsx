import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './ProjectDetails.css';

const ProjectDetails = () => {
  const { id } = useParams();
  const { currentUser } = useAuth();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Join request state
  const [joinStatus, setJoinStatus] = useState(null); // 'pending', 'accepted', 'rejected', or null
  const [ownerRequests, setOwnerRequests] = useState([]);
  const [requesting, setRequesting] = useState(false);
  const [actionError, setActionError] = useState('');

  // AI Matching state
  const [aiRecommendations, setAiRecommendations] = useState(null);
  const [isMatching, setIsMatching] = useState(false);
  const [matchError, setMatchError] = useState('');

  useEffect(() => {
    const fetchProject = async () => {
      try {
        const token = await currentUser.getIdToken();
        const response = await fetch(`http://localhost:5000/api/projects/${id}`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        if (!response.ok) {
          if (response.status === 404) {
            throw new Error('Project not found');
          }
          throw new Error('Failed to load project details');
        }

        const data = await response.json();
        setProject(data);

        // If creator, fetch owner requests, else fetch my requests to find status
        if (data.creatorFirebaseUid === currentUser.uid) {
          const reqResponse = await fetch(`http://localhost:5000/api/projects/${id}/join-requests`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (reqResponse.ok) {
            const reqData = await reqResponse.json();
            setOwnerRequests(reqData);
          }
        } else {
          // fetch my requests to see if I already requested
          const myReqResponse = await fetch(`http://localhost:5000/api/join-requests/my`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (myReqResponse.ok) {
            const myReqs = await myReqResponse.json();
            const existingReq = myReqs.find(req => req.projectId._id === id || req.projectId === id);
            if (existingReq) {
              setJoinStatus(existingReq.status);
            }
          }
        }
      } catch (err) {
        setError(err.message || 'Error loading project');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    if (currentUser && id) {
      fetchProject();
    }
  }, [currentUser, id]);

  const handleRequestJoin = async () => {
    setRequesting(true);
    setActionError('');
    try {
      const token = await currentUser.getIdToken();
      const response = await fetch(`http://localhost:5000/api/projects/${id}/join`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to send request');
      setJoinStatus('pending');
    } catch (err) {
      setActionError(err.message);
    } finally {
      setRequesting(false);
    }
  };

  const handleUpdateStatus = async (requestId, status) => {
    setActionError('');
    try {
      const token = await currentUser.getIdToken();
      const response = await fetch(`http://localhost:5000/api/join-requests/${requestId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to update request');
      
      // Update local state
      setOwnerRequests(prev => prev.map(req => req._id === requestId ? { ...req, status } : req));
    } catch (err) {
      setActionError(err.message);
    }
  };

  const handleFindTeam = async () => {
    setIsMatching(true);
    setMatchError('');
    setAiRecommendations(null);
    try {
      const token = await currentUser.getIdToken();
      const response = await fetch(`http://localhost:5000/api/ai/match/${id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        }
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        if (response.status === 401) throw new Error('Please log in again.');
        if (response.status === 403) throw new Error('You are not authorized to find a team for this project.');
        if (response.status === 404) throw new Error('Project not found.');
        if (response.status === 503) throw new Error('AI matching service is currently unavailable. Please try again later.');
        throw new Error('Unable to generate team recommendations. Please try again.');
      }
      
      setAiRecommendations(data.recommendations || []);
    } catch (err) {
      setMatchError(err.message || 'Unable to generate team recommendations. Please try again.');
    } finally {
      setIsMatching(false);
    }
  };

  if (loading) {
    return (
      <div className="project-details-page container">
        <div style={{ textAlign: 'center', marginTop: '4rem' }}>
          <p>Loading project details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="project-details-page container animate-fade-in">
        <div style={{ marginBottom: '2rem', display: 'flex', gap: '1rem' }}>
          <Link to="/" className="btn btn-outline btn-sm">
            &larr; Back to Home
          </Link>
          <Link to="/projects" className="btn btn-outline btn-sm">
            &larr; Back to Projects
          </Link>
        </div>
        <div className="glass" style={{ padding: '3rem', textAlign: 'center' }}>
          <h2 style={{ color: 'var(--accent-color)' }}>{error}</h2>
          <p>The project you are looking for may have been deleted.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="project-details-page container animate-fade-in">
      <div style={{ marginBottom: '2rem', display: 'flex', gap: '1rem' }}>
        <Link to="/" className="btn btn-outline btn-sm">
          &larr; Back to Home
        </Link>
        <Link to="/projects" className="btn btn-outline btn-sm">
          &larr; Back to Projects
        </Link>
      </div>
      
      {actionError && <div className="alert error" style={{ marginBottom: '1rem' }}>{actionError}</div>}

      <div className="glass project-full-card">
        <div className="project-header">
          <div>
            <span className="project-category">{project.category}</span>
            <h1 className="project-title-large">{project.title}</h1>
            <p className="project-date">
              Posted on {new Date(project.createdAt).toLocaleDateString()} by {project.creatorName}
            </p>
          </div>
          
          <div className="project-actions">
            {project.creatorFirebaseUid === currentUser.uid && (
              <button 
                className="btn btn-primary ai-match-btn" 
                onClick={handleFindTeam} 
                disabled={isMatching}
              >
                {isMatching ? 'Finding the best team...' : 'Find My Team'}
              </button>
            )}
            {project.creatorFirebaseUid !== currentUser.uid && (
              <>
                {!joinStatus && (
                  <button className="btn btn-primary" onClick={handleRequestJoin} disabled={requesting}>
                    {requesting ? 'Sending...' : 'Request to Join'}
                  </button>
                )}
                {joinStatus === 'pending' && <span className="status-badge pending">Request Pending</span>}
                {joinStatus === 'accepted' && <span className="status-badge accepted">Request Accepted</span>}
                {joinStatus === 'rejected' && <span className="status-badge rejected">Request Rejected</span>}
              </>
            )}
          </div>
        </div>

        <div className="project-body">
          <div className="project-main-col">
            <section className="detail-section">
              <h3>Description</h3>
              <p style={{ whiteSpace: 'pre-wrap', lineHeight: '1.6' }}>{project.description}</p>
            </section>

            <section className="detail-section">
              <h3>Required Skills</h3>
              <div className="skills-list">
                {project.requiredSkills.map((skill, index) => (
                  <span key={index} className="skill-tag">
                    {skill}
                  </span>
                ))}
              </div>
            </section>

            {project.creatorFirebaseUid === currentUser.uid && (
              <>
                <section className="detail-section ai-recommendation-section">
                  <h3>AI Recommended Team</h3>
                  
                  {matchError && (
                    <div className="alert error" style={{ marginBottom: '1rem' }}>
                      {matchError}
                    </div>
                  )}
                  
                  {isMatching && (
                    <div className="ai-loading-state">
                      <div className="spinner"></div>
                      <p>Finding the best team...</p>
                    </div>
                  )}

                  {aiRecommendations !== null && !isMatching && (
                    aiRecommendations.length === 0 ? (
                      <p className="text-muted">No suitable students were found for this project yet.</p>
                    ) : (
                      <div className="recommendations-list">
                        {aiRecommendations.map((rec, index) => (
                          <div key={index} className="glass recommendation-card">
                            <div className="rec-header">
                              <h4>{rec.studentName || rec.studentId}</h4>
                              <div className="match-score">
                                {rec.matchScore}% Match
                              </div>
                            </div>
                            
                            <div className="rec-body">
                              <div className="rec-group">
                                <strong>Matched Skills</strong>
                                <div className="skills-list small">
                                  {rec.matchedSkills && rec.matchedSkills.length > 0 
                                    ? rec.matchedSkills.map((s, i) => <span key={i} className="skill-tag">{s}</span>)
                                    : <span className="text-muted">None listed</span>}
                                </div>
                              </div>

                              <div className="rec-group">
                                <strong>Why this student matches</strong>
                                <ul>
                                  {rec.matchingReasons && rec.matchingReasons.length > 0 
                                    ? rec.matchingReasons.map((reason, i) => <li key={i}>{reason}</li>)
                                    : <li className="text-muted">No specific reasons provided</li>}
                                </ul>
                              </div>

                              {rec.skillGaps && rec.skillGaps.length > 0 && (
                                <div className="rec-group">
                                  <strong>Skill Gaps</strong>
                                  <ul>
                                    {rec.skillGaps.map((gap, i) => <li key={i}>{gap}</li>)}
                                  </ul>
                                </div>
                              )}

                              <div style={{ marginTop: '0.5rem', color: 'var(--text-main)', fontSize: '0.9rem' }}>
                                <div><strong>Experience:</strong> {rec.experience || 'Not specified'}</div>
                                <div><strong>Availability:</strong> {rec.availability || 'Not specified'}</div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )
                  )}
                  {aiRecommendations === null && !isMatching && !matchError && (
                     <p className="text-muted">Click "Find My Team" to discover students with matching skills.</p>
                  )}
                </section>

                <section className="detail-section">
                  <h3>Join Requests</h3>
                {ownerRequests.length === 0 ? (
                  <p className="text-muted">No join requests yet.</p>
                ) : (
                  <div className="requests-list" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {ownerRequests.map(req => (
                      <div key={req._id} className="glass request-card" style={{ padding: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <strong>{req.studentName}</strong>
                          <div className="text-muted" style={{ fontSize: '0.85rem' }}>{req.studentEmail}</div>
                          <div style={{ fontSize: '0.85rem', marginTop: '0.25rem' }}>
                            Status: <span className={`status-text ${req.status}`}>{req.status}</span>
                          </div>
                        </div>
                        {req.status === 'pending' && (
                          <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button className="btn btn-primary btn-sm" onClick={() => handleUpdateStatus(req._id, 'accepted')}>Accept</button>
                            <button className="btn btn-outline btn-sm" onClick={() => handleUpdateStatus(req._id, 'rejected')}>Reject</button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </section>
              </>
            )}
          </div>

          <div className="project-sidebar">
            <div className="glass sidebar-card">
              <h3>At a Glance</h3>
              <ul className="sidebar-list">
                <li>
                  <strong>Team Size:</strong> {project.teamSize} members
                </li>
                <li>
                  <strong>Duration:</strong> {project.duration || 'Not specified'}
                </li>
                <li>
                  <strong>Category:</strong> {project.category}
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectDetails;
