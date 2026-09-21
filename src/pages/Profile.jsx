import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import Navbar from '../components/Navbar';
import './Profile.css';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const getInitial = (name) => name ? name.charAt(0).toUpperCase() : '?';

const Profile = () => {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [completionPercent, setCompletionPercent] = useState(0);

  const [formData, setFormData] = useState({
    fullName: '', collegeEmail: '', department: '', year: '',
    skills: '', interests: '', experience: '', availability: ''
  });

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = await currentUser.getIdToken();
        const res = await fetch(`${API}/api/profile`, { headers: { Authorization: `Bearer ${token}` } });
        if (!res.ok) throw new Error('Failed to fetch profile');
        const data = await res.json();
        setFormData({
          fullName: data.fullName || currentUser.displayName || '',
          collegeEmail: data.collegeEmail || currentUser.email || '',
          department: data.department || '',
          year: data.year || '',
          skills: data.skills ? data.skills.join(', ') : '',
          interests: data.interests ? data.interests.join(', ') : '',
          experience: data.experience || '',
          availability: data.availability || ''
        });
        calculateCompletion(data);
      } catch (err) {
        setError('Error loading profile. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    if (currentUser) fetchProfile();
  }, [currentUser]);

  const calculateCompletion = (data) => {
    const fields = ['fullName', 'collegeEmail', 'department', 'year', 'skills', 'interests', 'experience', 'availability'];
    let filled = 0;
    fields.forEach(f => {
      if (Array.isArray(data[f]) && data[f].length > 0) filled++;
      else if (typeof data[f] === 'string' && data[f].trim() !== '') filled++;
    });
    setCompletionPercent(Math.round((filled / fields.length) * 100));
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (success) setSuccess('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true); setError(''); setSuccess('');
    try {
      const token = await currentUser.getIdToken();
      const payload = {
        ...formData,
        skills: formData.skills.split(',').map(s => s.trim()).filter(Boolean),
        interests: formData.interests.split(',').map(s => s.trim()).filter(Boolean)
      };
      const res = await fetch(`${API}/api/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error('Failed to update profile');
      const updatedData = await res.json();
      setSuccess('Profile updated successfully!');
      calculateCompletion(updatedData);
    } catch (err) {
      setError('Error saving profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="container profile-page">
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Loading profile...</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="container profile-page">
        <div className="profile-layout">

          {/* Header Card */}
          <div className="profile-header-card">
            <div className="profile-top">
              <div className="profile-avatar">{getInitial(formData.fullName)}</div>
              <div>
                <div className="profile-name">{formData.fullName || 'Your Name'}</div>
                <div className="profile-email">{formData.collegeEmail}</div>
                {formData.department && (
                  <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>
                    {formData.department}{formData.year ? ` · ${formData.year}` : ''}
                  </div>
                )}
              </div>
            </div>

            <div className="completion-section">
              <span className="completion-label">Profile completion</span>
              <div className="completion-bar-wrap">
                <div className="completion-bar-fill" style={{ width: `${completionPercent}%` }}></div>
              </div>
              <span className="completion-pct">{completionPercent}%</span>
            </div>
          </div>

          {/* Alerts */}
          {error   && <div className="alert alert-error">{error}</div>}
          {success && <div className="alert alert-success">{success}</div>}

          {/* Form */}
          <div className="profile-form-card">
            <div className="profile-section-title">Your Information</div>
            <form onSubmit={handleSubmit}>
              <div className="profile-form-grid">
                <div className="profile-form-group">
                  <label className="profile-form-label" htmlFor="fullName">Full Name</label>
                  <input type="text" id="fullName" name="fullName" value={formData.fullName} onChange={handleChange} required />
                </div>
                <div className="profile-form-group">
                  <label className="profile-form-label" htmlFor="collegeEmail">College Email</label>
                  <input type="email" id="collegeEmail" name="collegeEmail" value={formData.collegeEmail} onChange={handleChange} required />
                </div>
                <div className="profile-form-group">
                  <label className="profile-form-label" htmlFor="department">Department</label>
                  <input type="text" id="department" name="department" placeholder="e.g. Computer Science" value={formData.department} onChange={handleChange} />
                </div>
                <div className="profile-form-group">
                  <label className="profile-form-label" htmlFor="year">Year of Study</label>
                  <select id="year" name="year" value={formData.year} onChange={handleChange}>
                    <option value="">Select year...</option>
                    <option value="1st Year">1st Year</option>
                    <option value="2nd Year">2nd Year</option>
                    <option value="3rd Year">3rd Year</option>
                    <option value="4th Year">4th Year</option>
                  </select>
                </div>
              </div>

              <div className="profile-section-title" style={{ marginTop: '8px' }}>Skills & Interests</div>
              <div className="profile-form-group full-width">
                <label className="profile-form-label" htmlFor="skills">Skills</label>
                <input type="text" id="skills" name="skills" placeholder="React, Node.js, Python, Figma..." value={formData.skills} onChange={handleChange} />
                <span className="profile-form-help">Separate with commas. These will be used for AI matching.</span>
              </div>
              <div className="profile-form-group full-width">
                <label className="profile-form-label" htmlFor="interests">Interests</label>
                <input type="text" id="interests" name="interests" placeholder="Machine Learning, Web Dev, UI/UX, Open Source..." value={formData.interests} onChange={handleChange} />
                <span className="profile-form-help">Separate with commas.</span>
              </div>

              <div className="profile-section-title" style={{ marginTop: '8px' }}>Experience & Availability</div>
              <div className="profile-form-group full-width">
                <label className="profile-form-label" htmlFor="experience">Experience</label>
                <textarea id="experience" name="experience" placeholder="Describe your projects, internships, hackathons, certifications..." value={formData.experience} onChange={handleChange} rows={4} />
              </div>
              <div className="profile-form-group full-width">
                <label className="profile-form-label" htmlFor="availability">Availability</label>
                <input type="text" id="availability" name="availability" placeholder="e.g. 10 hours/week, weekends only" value={formData.availability} onChange={handleChange} />
              </div>

              <div className="profile-form-actions">
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Saving...' : 'Save Profile'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
};

export default Profile;
