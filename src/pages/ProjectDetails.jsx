import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Navbar from '../components/Navbar';
import { API_URL as API } from '../config';
import { io } from 'socket.io-client';
import './ProjectDetails.css';

const getCatClass = (cat) => {
  const map = { 'Web Development': 'cat-web', 'Mobile Development': 'cat-mobile', 'AI / Machine Learning': 'cat-ai', 'Data Science': 'cat-data', 'Cybersecurity': 'cat-cyber', 'Cloud / DevOps': 'cat-cloud' };
  return map[cat] || '';
};

const getScoreClass = (score) => score >= 80 ? 'score-high' : score >= 50 ? 'score-medium' : 'score-low';
const getInitial = (name) => name ? name.charAt(0).toUpperCase() : '?';

const getStatusClass = (status) => {
  const map = {
    'Planning': 'status-planning',
    'Team Forming': 'status-team-forming',
    'In Progress': 'status-in-progress',
    'Completed': 'status-completed',
    'Cancelled': 'status-cancelled'
  };
  return map[status] || 'status-planning';
};

const TeamChat = ({ teamId, currentUser, API }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [socketStatus, setSocketStatus] = useState('Connecting...');
  
  const messagesEndRef = useRef(null);
  const socketRef = useRef(null);

  const fetchMessages = async () => {
    try {
      const token = await currentUser.getIdToken();
      const res = await fetch(`${API}/api/teams/${teamId}/messages`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to load chat messages');
      const data = await res.json();
      setMessages(data);
    } catch (err) {
      setError(err.message || 'Failed to load messages');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;
    
    const initChat = async () => {
      // 1. Fetch initial REST messages
      await fetchMessages();
      if (!isMounted) return;

      // 2. Initialize Socket
      try {
        const token = await currentUser.getIdToken();
        const socketUrl = API.replace(/\/api\/?$/, ''); // Remove trailing /api if present
        
        const socket = io(socketUrl, {
          auth: { token }
        });
        socketRef.current = socket;

        socket.on('connect', () => {
          if (!isMounted) return;
          setSocketStatus('Connected');
          socket.emit('join-team', { teamId });
        });

        socket.on('disconnect', () => {
          if (!isMounted) return;
          setSocketStatus('Disconnected');
        });

        socket.on('connect_error', () => {
          if (!isMounted) return;
          setSocketStatus('Disconnected');
          setError('Real-time connection unavailable. Please try again.');
        });

        socket.on('chat-error', (data) => {
          if (!isMounted) return;
          setError(data.message || 'An error occurred in chat');
          setSending(false); // unlock if we were waiting for send
        });

        socket.on('new-team-message', (newMsg) => {
          if (!isMounted) return;
          setMessages(prev => {
            // Prevent duplicates using MongoDB _id
            if (prev.some(m => m._id === newMsg._id)) return prev;
            return [...prev, newMsg];
          });
          setSending(false); // unlock sender if it was their message
        });

      } catch (err) {
        if (!isMounted) return;
        setSocketStatus('Disconnected');
        setError('Failed to establish real-time connection.');
      }
    };

    initChat();

    return () => {
      isMounted = false;
      if (socketRef.current) {
        socketRef.current.off('connect');
        socketRef.current.off('disconnect');
        socketRef.current.off('connect_error');
        socketRef.current.off('chat-error');
        socketRef.current.off('new-team-message');
        socketRef.current.disconnect();
      }
    };
  }, [teamId, currentUser, API]);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    const trimmed = newMessage.trim();
    if (!trimmed) return;
    if (trimmed.length > 1000) {
      setError('Message exceeds 1000 characters limit');
      return;
    }
    
    if (!socketRef.current || !socketRef.current.connected) {
      setError('Cannot send message: Not connected');
      return;
    }

    setSending(true);
    setError('');
    
    // Send via socket. Wait for new-team-message to update UI.
    socketRef.current.emit('send-team-message', {
      teamId,
      message: trimmed
    });
    
    setNewMessage('');
    // Note: setSending(false) will be called when the message arrives back from the server
    // or if a chat-error happens. We could also add a timeout if we want, but server should be fast.
  };

  return (
    <div className="section-card chat-section" style={{ display: 'flex', flexDirection: 'column', height: '500px' }}>
      <div className="chat-header" style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h3 className="section-card-title" style={{ marginBottom: '4px', borderBottom: 'none', paddingBottom: 0 }}>
            Team Chat
            <span style={{ 
              fontSize: '12px', 
              marginLeft: '12px', 
              fontWeight: 'normal',
              color: socketStatus === 'Connected' ? 'var(--success)' : 
                     socketStatus === 'Connecting...' ? 'var(--warning)' : 'var(--error)' 
            }}>
              ● {socketStatus}
            </span>
          </h3>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Discuss your project with your team members.</p>
        </div>
      </div>

      <div className="chat-messages-container" style={{ flex: 1, overflowY: 'auto', padding: '12px', background: 'var(--surface-1)', borderRadius: 'var(--r-md)', border: '1px solid var(--border)', marginBottom: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {loading ? (
          <div className="chat-loading" style={{ color: 'var(--text-muted)', textAlign: 'center', margin: 'auto' }}>Loading messages...</div>
        ) : messages.length === 0 ? (
          <div className="chat-empty" style={{ color: 'var(--text-muted)', textAlign: 'center', margin: 'auto' }}>No messages yet. Start the conversation!</div>
        ) : (
          <div className="chat-messages-list" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {messages.map(msg => {
              const isMine = msg.senderFirebaseUid === currentUser.uid;
              return (
                <div key={msg._id} className={`chat-message-wrapper ${isMine ? 'mine' : 'theirs'}`} style={{ display: 'flex', flexDirection: 'column', alignItems: isMine ? 'flex-end' : 'flex-start' }}>
                  <div className="chat-message-bubble" style={{ maxWidth: '85%', padding: '8px 12px', borderRadius: '12px', background: isMine ? 'var(--blue-muted)' : 'var(--surface-2)', border: isMine ? '1px solid var(--blue-border)' : '1px solid var(--border)', color: 'var(--text-primary)', borderBottomRightRadius: isMine ? '4px' : '12px', borderBottomLeftRadius: isMine ? '12px' : '4px' }}>
                    {!isMine && <div className="chat-sender-name" style={{ fontSize: '11px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '2px' }}>{msg.senderName}</div>}
                    <div className="chat-message-text" style={{ fontSize: '14px', whiteSpace: 'pre-wrap', wordBreak: 'break-word', lineHeight: '1.4' }}>{msg.message}</div>
                    <div className="chat-message-time" style={{ fontSize: '10px', color: 'var(--text-muted)', textAlign: 'right', marginTop: '4px' }}>
                      {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {error && <div className="form-error" style={{ marginBottom: '8px' }}>{error}</div>}

      <form className="chat-input-area" onSubmit={handleSendMessage} style={{ display: 'flex', gap: '8px' }}>
        <textarea
          className="chat-input"
          placeholder="Type a message..."
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          disabled={sending}
          rows={1}
          style={{ flex: 1, resize: 'none', minHeight: '40px', padding: '10px 12px' }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSendMessage(e);
            }
          }}
        />
        <button type="submit" className="btn btn-primary" disabled={sending || !newMessage.trim()} style={{ height: 'auto', padding: '0 20px' }}>
          {sending ? '...' : 'Send'}
        </button>
      </form>
    </div>
  );
};

const ProjectDetails = () => {
  const { id } = useParams();
  const { currentUser } = useAuth();

  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [joinStatus, setJoinStatus] = useState(null);
  const [ownerRequests, setOwnerRequests] = useState([]);
  const [requesting, setRequesting] = useState(false);
  const [actionError, setActionError] = useState('');

  const [invitations, setInvitations] = useState([]);
  
  const [teamData, setTeamData] = useState(null);
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [isFormingTeam, setIsFormingTeam] = useState(false);
  const [isDeletingTeam, setIsDeletingTeam] = useState(false);

  const [aiRecommendations, setAiRecommendations] = useState(null);
  const [projectOwner, setProjectOwner] = useState(null);
  const [isMatching, setIsMatching] = useState(false);
  const [matchError, setMatchError] = useState('');
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  const computedCoverage = React.useMemo(() => {
    if (!project || !project.requiredSkills || !projectOwner) return null;

    const normalizeSkill = (skill) => skill.trim().toLowerCase();
    
    // 1. Start with the project owner
    const teamMembers = [{
      studentId: projectOwner.studentId,
      studentName: projectOwner.studentName,
      skills: projectOwner.skills || []
    }];

    // 2. Add currently selected students from aiRecommendations
    if (aiRecommendations && Array.isArray(aiRecommendations)) {
      selectedStudents.forEach(id => {
        // Force case-insensitive match just in case, and match both id and firebaseUid if available
        const rec = aiRecommendations.find(r => 
          String(r.studentId) === String(id) || 
          String(r.id) === String(id) ||
          String(r._id) === String(id)
        );
        if (rec) {
          teamMembers.push({
            studentId: rec.studentId || id,
            studentName: rec.studentName || rec.studentId || id,
            // Ensure skills is always an array of strings
            skills: Array.isArray(rec.skills) ? rec.skills : 
                   (typeof rec.skills === 'string' ? rec.skills.split(',').map(s => s.trim()) : 
                   (rec.matchedSkills || []))
          });
        }
      });
    }

    const skillToStudentsMap = {};
    const skillCoverage = [];

    // Initialize required skills
    project.requiredSkills.forEach(reqSkill => {
      const normReqSkill = normalizeSkill(reqSkill);
      skillToStudentsMap[normReqSkill] = [];
      skillCoverage.push({
        skill: reqSkill,
        covered: false,
        students: []
      });
    });

    // Evaluate coverage against all actual team members
    teamMembers.forEach(member => {
      (member.skills || []).forEach(memberSkill => {
        const normMemberSkill = normalizeSkill(memberSkill);
        if (skillToStudentsMap[normMemberSkill] !== undefined) {
          const existingStudents = skillToStudentsMap[normMemberSkill];
          if (!existingStudents.some(s => s.studentId === member.studentId)) {
             existingStudents.push({
               studentId: member.studentId,
               studentName: member.studentName
             });
          }
        }
      });
    });

    const coveredSkills = [];
    const missingSkills = [];

    skillCoverage.forEach(sc => {
      const normSkill = normalizeSkill(sc.skill);
      const coveringStudents = skillToStudentsMap[normSkill];
      
      if (coveringStudents && coveringStudents.length > 0) {
        sc.covered = true;
        sc.students = coveringStudents;
        coveredSkills.push(sc.skill);
      } else {
        missingSkills.push(sc.skill);
      }
    });

    const totalRequired = project.requiredSkills.length;
    const coveragePercentage = totalRequired === 0 ? 100 : Math.round((coveredSkills.length / totalRequired) * 100);

    return {
      teamCoverage: {
        requiredSkills: project.requiredSkills,
        coveredSkills,
        missingSkills,
        coveragePercentage
      },
      skillCoverage
    };
  }, [project, projectOwner, selectedStudents, aiRecommendations]);

  const teamCoverage = computedCoverage ? computedCoverage.teamCoverage : null;
  const skillCoverage = computedCoverage ? computedCoverage.skillCoverage : null;


  useEffect(() => {
    const fetchProject = async () => {
      try {
        const token = await currentUser.getIdToken();
        const res = await fetch(`${API}/api/projects/${id}`, { headers: { Authorization: `Bearer ${token}` } });
        if (!res.ok) throw new Error(res.status === 404 ? 'Project not found' : 'Failed to load project');
        const data = await res.json();
        setProject(data);

        if (data.creatorFirebaseUid === currentUser.uid) {
          const reqRes = await fetch(`${API}/api/projects/${id}/join-requests`, { headers: { Authorization: `Bearer ${token}` } });
          if (reqRes.ok) setOwnerRequests(await reqRes.json());
          
          const invRes = await fetch(`${API}/api/projects/${id}/invitations`, { headers: { Authorization: `Bearer ${token}` } });
          if (invRes.ok) setInvitations(await invRes.json());
        } else {
          const myRes = await fetch(`${API}/api/join-requests/my`, { headers: { Authorization: `Bearer ${token}` } });
          if (myRes.ok) {
            const myReqs = await myRes.json();
            const existing = myReqs.find(r => r.projectId._id === id || r.projectId === id);
            if (existing) setJoinStatus(existing.status);
          }
        }

        try {
          const teamRes = await fetch(`${API}/api/projects/${id}/team`, { headers: { Authorization: `Bearer ${token}` } });
          if (teamRes.ok) setTeamData(await teamRes.json());
        } catch (e) { console.error('Team fetch error:', e); }

      } catch (err) {
        setError(err.message || 'Error loading project');
      } finally {
        setLoading(false);
      }
    };
    if (currentUser && id) fetchProject();
  }, [currentUser, id]);

  const handleRequestJoin = async () => {
    setRequesting(true); setActionError('');
    try {
      const token = await currentUser.getIdToken();
      const res = await fetch(`${API}/api/projects/${id}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to send request');
      setJoinStatus('pending');
    } catch (err) { setActionError(err.message); }
    finally { setRequesting(false); }
  };

  const handleUpdateStatus = async (requestId, status) => {
    setActionError('');
    try {
      const token = await currentUser.getIdToken();
      const res = await fetch(`${API}/api/join-requests/${requestId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to update request');
      setOwnerRequests(prev => prev.map(r => r._id === requestId ? { ...r, status } : r));
      
      if (status === 'accepted') {
        const teamRes = await fetch(`${API}/api/projects/${id}/team`, { headers: { Authorization: `Bearer ${token}` } });
        if (teamRes.ok) setTeamData(await teamRes.json());
      }
    } catch (err) { setActionError(err.message); }
  };

  const handleToggleStudent = (studentId) => {
    setSelectedStudents(prev =>
      prev.includes(studentId) ? prev.filter(id => id !== studentId) : [...prev, studentId]
    );
  };

  const handleSendInvitations = async () => {
    setIsFormingTeam(true); setActionError('');
    try {
      const token = await currentUser.getIdToken();
      const res = await fetch(`${API}/api/projects/${id}/invitations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ selectedStudentIds: selectedStudents })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to send invitations');
      
      // Refresh invitations
      const invRes = await fetch(`${API}/api/projects/${id}/invitations`, { headers: { Authorization: `Bearer ${token}` } });
      if (invRes.ok) setInvitations(await invRes.json());
      
      setSelectedStudents([]);
      alert('Invitations sent successfully!');
    } catch (err) { setActionError(err.message); }
    finally { setIsFormingTeam(false); }
  };

  const handleDeleteTeam = async () => {
    if (!window.confirm('Are you sure you want to dissolve this team?')) return;
    setIsDeletingTeam(true); setActionError('');
    try {
      const token = await currentUser.getIdToken();
      const res = await fetch(`${API}/api/projects/${id}/team`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.message || 'Failed to delete team'); }
      setTeamData(null); setSelectedStudents([]);
    } catch (err) { setActionError(err.message); }
    finally { setIsDeletingTeam(false); }
  };

  const handleStatusAction = async (newStatus) => {
    if (!window.confirm(`Are you sure you want to mark this project as ${newStatus}?`)) return;
    setIsUpdatingStatus(true);
    setActionError('');
    try {
      const token = await currentUser.getIdToken();
      const res = await fetch(`${API}/api/projects/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status: newStatus })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to update status');
      setProject(prev => ({ ...prev, status: data.status }));
    } catch (err) {
      setActionError(err.message);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleFindTeam = async () => {
    setIsMatching(true); setMatchError(''); setAiRecommendations(null); setProjectOwner(null);
    try {
      const token = await currentUser.getIdToken();
      const res = await fetch(`${API}/api/ai/match/${id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 401) throw new Error('Please log in again.');
        if (res.status === 403) throw new Error('Only project owners can run AI matching.');
        if (res.status === 404) throw new Error('Project not found.');
        if (res.status === 503) throw new Error('AI matching service is unavailable. Please try again later.');
        throw new Error(data.message || 'Unable to generate recommendations. Please try again.');
      }
      setAiRecommendations(data.recommendations || []);
      setProjectOwner(data.projectOwner || null);
    } catch (err) { setMatchError(err.message); }
    finally { setIsMatching(false); }
  };

  const isOwner = project && currentUser && project.creatorFirebaseUid === currentUser.uid;

  const isTeamMember = teamData && currentUser && (
    teamData.ownerStudentId?.firebaseUid === currentUser.uid ||
    teamData.ownerStudentId === currentUser.uid || // in case it's not populated yet
    teamData.memberStudentIds?.some(m => m.firebaseUid === currentUser.uid || m === currentUser.uid)
  );

  const isTeamFull = teamData ? teamData.memberStudentIds.length >= project.teamSize : false;

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="container project-details-page">
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Loading project...</p>
          </div>
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <Navbar />
        <div className="container project-details-page">
          <div className="breadcrumb">
            <Link to="/">Home</Link><span className="breadcrumb-sep">/</span>
            <Link to="/projects">Projects</Link>
          </div>
          <div className="section-card" style={{ textAlign: 'center', padding: '60px 24px' }}>
            <p style={{ fontSize: '36px', marginBottom: '16px' }}>🔍</p>
            <h2 style={{ marginBottom: '8px', color: 'var(--text-primary)' }}>{error}</h2>
            <p>The project may have been deleted or you may not have access.</p>
            <Link to="/projects" className="btn btn-secondary" style={{ marginTop: '20px' }}>Back to Projects</Link>
          </div>
        </div>
      </>
    );
  }

  const maxReached = selectedStudents.length + 1 >= project.teamSize;

  return (
    <>
      <Navbar />
      <div className="container project-details-page">

        {/* Breadcrumb */}
        <div className="breadcrumb">
          <Link to="/">Home</Link>
          <span className="breadcrumb-sep">/</span>
          <Link to="/projects">Projects</Link>
          <span className="breadcrumb-sep">/</span>
          <span style={{ color: 'var(--text-secondary)' }}>{project.title}</span>
        </div>

        {actionError && <div className="alert alert-error" style={{ marginBottom: '16px' }}>{actionError}</div>}

        <div className="workspace-layout">

          {/* ── Main Column ── */}
          <div className="workspace-main">

            {/* Project Header */}
            <div className="project-header-card">
              <div className="project-header-top">
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="project-header-meta" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span className={`cat-badge ${getCatClass(project.category)}`}>{project.category}</span>
                    <span style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      Status: <span className={`status-pill ${getStatusClass(project.status || 'Planning')}`}>{project.status || 'Planning'}</span>
                    </span>
                    {isOwner && project.status !== 'Completed' && project.status !== 'Cancelled' && (
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button 
                          className="btn btn-sm btn-outline" 
                          onClick={() => handleStatusAction('Completed')}
                          disabled={isUpdatingStatus}
                          style={{ fontSize: '11px', padding: '2px 8px' }}
                        >
                          Mark Completed
                        </button>
                        <button 
                          className="btn btn-sm btn-outline" 
                          onClick={() => handleStatusAction('Cancelled')}
                          disabled={isUpdatingStatus}
                          style={{ fontSize: '11px', padding: '2px 8px', color: 'var(--error)' }}
                        >
                          Cancel Project
                        </button>
                      </div>
                    )}
                  </div>
                  <h1 className="project-title">{project.title}</h1>
                  <div className="project-byline">
                    Posted by {project.creatorName} · {new Date(project.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                  </div>
                </div>

                <div className="project-header-actions">
                  {isOwner && !teamData && (
                    <button className="btn btn-ai btn-lg" onClick={handleFindTeam} disabled={isMatching}>
                      {isMatching ? (
                        <><span className="spinner" style={{ width: '14px', height: '14px', borderWidth: '2px' }}></span> Finding...</>
                      ) : (
                        <>✦ Find My Team</>
                      )}
                    </button>
                  )}
                  {!isOwner && !isTeamMember && (
                    <>
                      {joinStatus === 'pending' && <span className="status-badge pending">Request Pending</span>}
                      {joinStatus === 'rejected' && <span className="status-badge rejected">Request Rejected</span>}
                      {!joinStatus && !isTeamFull && (
                        <button className="btn btn-primary" onClick={handleRequestJoin} disabled={requesting}>
                          {requesting ? 'Sending...' : 'Request to Join'}
                        </button>
                      )}
                      {!joinStatus && isTeamFull && (
                        <span className="status-badge" style={{ background: 'var(--surface-2)', color: 'var(--text-muted)' }}>Team Full</span>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="section-card">
              <div className="section-card-title">Description</div>
              <p className="project-description-text">{project.description}</p>
            </div>

            {/* Required Skills */}
            <div className="section-card">
              <div className="section-card-title">Required Skills</div>
              <div className="skills-list">
                {project.requiredSkills.map((skill, i) => (
                  <span key={i} className="skill-tag skill-tag-blue">{skill}</span>
                ))}
              </div>
            </div>

            {/* ── Formed Team ── */}
            {teamData && (
              <div className="team-section">
                <div className="team-section-header">
                  <div className="team-section-title">
                    <span>👥</span> Project Team
                  </div>
                  <span className="team-formed-badge">
                    {teamData.memberStudentIds.length} / {project.teamSize} members
                  </span>
                </div>

                <div className="team-members-grid">
                  {/* Owner */}
                  <div className="team-member-card owner-card">
                    <div className="team-member-header">
                      <div className="team-member-avatar owner-avatar">
                        {getInitial(teamData.ownerStudentId.fullName)}
                      </div>
                      <div>
                        <div className="team-member-name">{teamData.ownerStudentId.fullName}</div>
                        <div className="team-member-role">Project Owner</div>
                      </div>
                    </div>
                    {teamData.ownerStudentId.experience && (
                      <div className="team-member-detail">{teamData.ownerStudentId.experience.substring(0, 60)}{teamData.ownerStudentId.experience.length > 60 ? '...' : ''}</div>
                    )}
                    <div className="skills-list" style={{ marginTop: '8px' }}>
                      {(teamData.ownerStudentId.skills || []).slice(0, 4).map((s, i) => (
                        <span key={i} className="skill-tag">{s}</span>
                      ))}
                    </div>
                  </div>

                  {/* Members (excluding owner) */}
                  {teamData.memberStudentIds
                    .filter(m => m._id !== teamData.ownerStudentId._id)
                    .map((member) => (
                      <div key={member._id} className="team-member-card">
                        <div className="team-member-header">
                          <div className="team-member-avatar">{getInitial(member.fullName)}</div>
                          <div>
                            <div className="team-member-name">{member.fullName}</div>
                            <div className="team-member-role">Team Member</div>
                          </div>
                        </div>
                        {member.experience && (
                          <div className="team-member-detail">{member.experience.substring(0, 60)}{member.experience.length > 60 ? '...' : ''}</div>
                        )}
                        <div className="skills-list" style={{ marginTop: '8px' }}>
                          {(member.skills || []).slice(0, 4).map((s, i) => (
                            <span key={i} className="skill-tag">{s}</span>
                          ))}
                        </div>
                      </div>
                    ))}
                </div>

                {isOwner && (
                  <div className="team-section-footer">
                    <button className="btn btn-danger btn-sm" onClick={handleDeleteTeam} disabled={isDeletingTeam}>
                      {isDeletingTeam ? 'Dissolving...' : 'Dissolve Team'}
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* ── Team Chat (Visible only to team members when team exists) ── */}
            {teamData && isTeamMember && (
              <TeamChat teamId={teamData._id} currentUser={currentUser} API={API} />
            )}

            {/* ── AI Matching (Owner only, no team yet) ── */}
            {isOwner && !teamData && (
              <>
                <div className="ai-section-card">
                  <div className="ai-section-header">
                    <div className="ai-section-title-group">
                      <div className="ai-icon">✦</div>
                      <div>
                        <div className="ai-section-label">AI Team Recommendations</div>
                        <div className="ai-section-sublabel">Students ranked by compatibility with this project</div>
                      </div>
                    </div>

                    {aiRecommendations && aiRecommendations.length > 0 && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                          Selected: <strong style={{ color: 'var(--text-primary)' }}>{selectedStudents.length + 1}</strong> / {project.teamSize}
                        </span>
                        <button
                          className="btn btn-primary btn-sm"
                          disabled={selectedStudents.length === 0 || isFormingTeam}
                          onClick={handleSendInvitations}
                        >
                          {isFormingTeam ? 'Sending...' : 'Send Invitations'}
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="ai-section-body">
                    {/* Error */}
                    {matchError && <div className="alert alert-error">{matchError}</div>}

                    {/* Loading */}
                    {isMatching && (
                      <div className="ai-loading">
                        <div className="ai-loading-spinner"></div>
                        <p>Analyzing student profiles against project requirements...</p>
                        <p className="ai-loading-hint">This may take a few seconds</p>
                      </div>
                    )}

                    {/* Idle */}
                    {!isMatching && aiRecommendations === null && !matchError && (
                      <div className="ai-idle-prompt">
                        <div style={{ fontSize: '32px' }}>✦</div>
                        <p>Click <strong>Find My Team</strong> to discover students whose skills, interests, and experience match this project.</p>
                      </div>
                    )}

                    {/* Results */}
                    {!isMatching && aiRecommendations !== null && (
                      <>
                        {/* Team Skill Coverage */}
                        {teamCoverage && teamCoverage.requiredSkills.length > 0 && (
                          <div className="coverage-card">
                            <div className="coverage-card-header">
                              <span className="coverage-card-title">Team Skill Coverage</span>
                              <span className="coverage-percent">{teamCoverage.coveragePercentage}%</span>
                            </div>
                            <div className="coverage-bar-track">
                              <div
                                className="coverage-bar-fill"
                                style={{
                                  width: `${teamCoverage.coveragePercentage}%`,
                                  background: teamCoverage.coveragePercentage >= 80
                                    ? 'var(--green)'
                                    : teamCoverage.coveragePercentage >= 50
                                    ? 'var(--amber)'
                                    : 'var(--red)',
                                }}
                              ></div>
                            </div>

                            <div className="skill-coverage-list">
                              {skillCoverage && skillCoverage.map(sc => (
                                <div key={sc.skill} className="skill-coverage-row">
                                  <span className="skill-coverage-name">{sc.skill}</span>
                                  {sc.covered ? (
                                    <div className="skill-coverage-status skill-covered">
                                      <span>✓</span>
                                      <span>{sc.students && sc.students.length > 0 ? sc.students.map(s => s.studentName).join(', ') : 'Covered'}</span>
                                    </div>
                                  ) : (
                                    <div className="skill-coverage-status skill-missing">
                                      <span>○</span>
                                      <span>Missing</span>
                                    </div>
                                  )}
                                </div>
                              ))}
                              {!skillCoverage && teamCoverage.coveredSkills.map(skill => (
                                <div key={skill} className="skill-coverage-row">
                                  <span className="skill-coverage-name">{skill}</span>
                                  <div className="skill-coverage-status skill-covered"><span>✓</span> Covered</div>
                                </div>
                              ))}
                              {!skillCoverage && teamCoverage.missingSkills.map(skill => (
                                <div key={skill} className="skill-coverage-row">
                                  <span className="skill-coverage-name">{skill}</span>
                                  <div className="skill-coverage-status skill-missing"><span>○</span> Missing</div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Recommendation Cards */}
                        {aiRecommendations.length === 0 ? (
                          <div className="empty-state">
                            <div className="empty-state-icon">👤</div>
                            <h3>No matching students found</h3>
                            <p>There are no students with matching profiles yet. Encourage more students to complete their profiles.</p>
                          </div>
                        ) : (
                          <div className="recommendations-grid">
                            {aiRecommendations.map((rec, index) => {
                              const isSelected = selectedStudents.includes(rec.studentId);
                              const existingInv = invitations.find(inv => inv.recipientFirebaseUid === rec.studentId);
                              const isInvited = !!existingInv;
                              const canSelect = !isInvited && (isSelected || !maxReached);
                              return (
                                <div
                                  key={index}
                                  className={`rec-card ${isSelected ? 'selected' : ''} ${(!canSelect && !isSelected) || isInvited ? 'disabled-select' : ''}`}
                                  onClick={() => canSelect && handleToggleStudent(rec.studentId)}
                                >
                                  <div className="rec-card-header">
                                    <div className="rec-card-left">
                                      {isInvited ? (
                                          <div className={`status-badge ${existingInv.status}`} style={{ marginRight: '10px' }}>
                                              {existingInv.status}
                                          </div>
                                      ) : (
                                          <input
                                            type="checkbox"
                                            className="rec-checkbox"
                                            checked={isSelected}
                                            onChange={() => canSelect && handleToggleStudent(rec.studentId)}
                                            disabled={!canSelect}
                                            onClick={e => e.stopPropagation()}
                                          />
                                      )}
                                      <div className="rec-avatar">{getInitial(rec.studentName || '')}</div>
                                      <div>
                                        <div className="rec-name">{rec.studentName || rec.studentId}</div>
                                        {rec.experience && (
                                          <div className="rec-meta">{rec.experience}</div>
                                        )}
                                      </div>
                                    </div>

                                    <div className="rec-score-container">
                                      <span className={`rec-score-badge ${getScoreClass(rec.matchScore)}`}>
                                        {rec.matchScore}%
                                      </span>
                                      <span className="rec-score-label">match</span>
                                    </div>
                                  </div>

                                  <div className="rec-body">
                                    {rec.matchedSkills && rec.matchedSkills.length > 0 && (
                                      <div>
                                        <div className="rec-group-label">Matched Skills</div>
                                        <div className="skills-list">
                                          {rec.matchedSkills.map((s, i) => (
                                            <span key={i} className="skill-tag skill-tag-green">{s}</span>
                                          ))}
                                        </div>
                                      </div>
                                    )}

                                    {rec.matchingReasons && rec.matchingReasons.length > 0 && (
                                      <div>
                                        <div className="rec-group-label">Why they match</div>
                                        <ul className="rec-reasons-list">
                                          {rec.matchingReasons.map((reason, i) => (
                                            <li key={i}>{reason}</li>
                                          ))}
                                        </ul>
                                      </div>
                                    )}

                                    {rec.skillGaps && rec.skillGaps.length > 0 && (
                                      <div>
                                        <div className="rec-group-label">Skill Gaps</div>
                                        <ul className="rec-gaps-list">
                                          {rec.skillGaps.map((gap, i) => (
                                            <li key={i}>{gap}</li>
                                          ))}
                                        </ul>
                                      </div>
                                    )}

                                    <div className="rec-extra">
                                      {rec.availability && (
                                        <div className="rec-extra-item">
                                          <span className="rec-extra-label">Availability</span>
                                          <span className="rec-extra-value">{rec.availability}</span>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>

                {/* Join Requests */}
                <div className="section-card">
                  <div className="section-card-title">Join Requests</div>
                  {ownerRequests.length === 0 ? (
                    <div className="empty-state" style={{ padding: '32px 0' }}>
                      <p>No join requests yet.</p>
                    </div>
                  ) : (
                    <div className="requests-list">
                      {ownerRequests.map(req => (
                        <div key={req._id} className="request-item">
                          <div className="request-info">
                            <div className="request-student-name">{req.studentName}</div>
                            <div className="request-student-email">{req.studentEmail}</div>
                          </div>
                          <div className="request-actions">
                            <span className={`status-badge ${req.status}`}>{req.status}</span>
                            {req.status === 'pending' && (
                              <>
                                <button className="btn btn-sm btn-primary" onClick={() => handleUpdateStatus(req._id, 'accepted')}>Accept</button>
                                <button className="btn btn-sm btn-danger"  onClick={() => handleUpdateStatus(req._id, 'rejected')}>Reject</button>
                              </>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          {/* ── Sidebar ── */}
          <div className="workspace-sidebar">
            <div className="sidebar-info-card">
              <div className="sidebar-info-card-header">
                <h3>Project Details</h3>
              </div>
              <ul className="sidebar-info-list">
                <li className="sidebar-info-item">
                  <span className="sidebar-info-icon">👥</span>
                  <div>
                    <div className="sidebar-info-label">Team Size</div>
                    <div className="sidebar-info-value">{project.teamSize} members</div>
                  </div>
                </li>
                {project.duration && (
                  <li className="sidebar-info-item">
                    <span className="sidebar-info-icon">⏱</span>
                    <div>
                      <div className="sidebar-info-label">Duration</div>
                      <div className="sidebar-info-value">{project.duration}</div>
                    </div>
                  </li>
                )}
                <li className="sidebar-info-item">
                  <span className="sidebar-info-icon">📂</span>
                  <div>
                    <div className="sidebar-info-label">Category</div>
                    <div className="sidebar-info-value">{project.category}</div>
                  </div>
                </li>
                <li className="sidebar-info-item">
                  <span className="sidebar-info-icon">👤</span>
                  <div>
                    <div className="sidebar-info-label">Created by</div>
                    <div className="sidebar-info-value">{project.creatorName}</div>
                  </div>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ProjectDetails;
