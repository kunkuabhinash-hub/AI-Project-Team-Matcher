import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Navbar from '../components/Navbar';
import './Profile.css';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const getInitial = (name) => name ? name.charAt(0).toUpperCase() : '?';

/* ── Helpers ─────────────────────────────────────────────────── */
// Convert raw API data into the flat shape used by this component
const toFormData = (data, firebaseUser) => ({
  fullName:     data.fullName     || firebaseUser?.displayName || '',
  collegeEmail: data.collegeEmail || firebaseUser?.email       || '',
  department:   data.department   || '',
  year:         data.year         || '',
  skills:       data.skills    ? data.skills.join(', ')    : '',
  interests:    data.interests ? data.interests.join(', ') : '',
  experience:   data.experience   || '',
  availability: data.availability || '',
});

const calculateCompletion = (data) => {
  const fields = ['fullName','collegeEmail','department','year','skills','interests','experience','availability'];
  let filled = 0;
  fields.forEach(f => {
    if (Array.isArray(data[f]) && data[f].length > 0) filled++;
    else if (typeof data[f] === 'string' && data[f].trim() !== '') filled++;
  });
  return Math.round((filled / fields.length) * 100);
};

/* ── Loading Skeleton ────────────────────────────────────────── */
const ProfileSkeleton = () => (
  <>
    <Navbar />
    <div className="container profile-page">
      <div className="profile-layout">
        <div className="profile-skeleton-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 24 }}>
            <div className="skeleton-pulse" style={{ width: 56, height: 56, borderRadius: '50%' }} />
            <div style={{ flex: 1 }}>
              <div className="skeleton-pulse" style={{ height: 18, width: '50%', marginBottom: 8 }} />
              <div className="skeleton-pulse" style={{ height: 13, width: '35%', marginBottom: 6 }} />
              <div className="skeleton-pulse" style={{ height: 12, width: '25%' }} />
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div className="skeleton-pulse" style={{ width: 120, height: 13 }} />
            <div className="skeleton-pulse" style={{ flex: 1, height: 6, borderRadius: 99 }} />
            <div className="skeleton-pulse" style={{ width: 36, height: 13 }} />
          </div>
        </div>
        <div className="profile-skeleton-body">
          <div className="skeleton-pulse" style={{ height: 12, width: '20%' }} />
          <div className="skeleton-pulse" style={{ height: 16, width: '60%' }} />
          <div className="skeleton-pulse" style={{ height: 16, width: '40%' }} />
          <div className="skeleton-pulse" style={{ height: 12, width: '20%', marginTop: 8 }} />
          <div style={{ display: 'flex', gap: 8 }}>
            {[55, 70, 48, 60].map((w, i) => (
              <div key={i} className="skeleton-pulse" style={{ height: 22, width: w, borderRadius: 99 }} />
            ))}
          </div>
          <div className="skeleton-pulse" style={{ height: 12, width: '20%', marginTop: 8 }} />
          <div className="skeleton-pulse" style={{ height: 60, width: '100%' }} />
        </div>
      </div>
    </div>
  </>
);

/* ── Read-only Detail View ───────────────────────────────────── */
const InfoRow = ({ label, value }) => (
  <div className="profile-info-row">
    <div className="profile-info-label">{label}</div>
    {value
      ? <div className="profile-info-value">{value}</div>
      : <div className="profile-info-value not-provided">Not provided</div>
    }
  </div>
);

const ProfileReadView = ({ profile, completionPercent, onEdit }) => {
  const skills    = profile.skills    ? profile.skills.split(',').map(s => s.trim()).filter(Boolean) : [];
  const interests = profile.interests ? profile.interests.split(',').map(s => s.trim()).filter(Boolean) : [];

  return (
    <>
      {/* Header card */}
      <div className="profile-header-card">
        <div className="profile-header-top-row">
          <div className="profile-top">
            <div className="profile-avatar">{getInitial(profile.fullName)}</div>
            <div className="profile-identity">
              <div className="profile-name">{profile.fullName || 'Your Name'}</div>
              <div className="profile-email">{profile.collegeEmail}</div>
              {(profile.department || profile.year) && (
                <div className="profile-dept-year">
                  {profile.department}{profile.department && profile.year ? ' · ' : ''}{profile.year}
                </div>
              )}
            </div>
          </div>
          <button className="btn btn-secondary btn-sm" onClick={onEdit} style={{ flexShrink: 0 }}>
            Edit Profile
          </button>
        </div>

        <div className="completion-section">
          <span className="completion-label">Profile completion</span>
          <div className="completion-bar-wrap">
            <div className="completion-bar-fill" style={{ width: `${completionPercent}%` }} />
          </div>
          <span className="completion-pct">{completionPercent}%</span>
        </div>
      </div>

      {/* Detail card */}
      <div className="profile-detail-card">
        <div className="profile-section-title">Profile Information</div>
        <div className="profile-info-grid">
          <InfoRow label="Full Name"     value={profile.fullName} />
          <InfoRow label="College Email" value={profile.collegeEmail} />
          <InfoRow label="Department"    value={profile.department} />
          <InfoRow label="Year of Study" value={profile.year} />
        </div>

        <div className="profile-section-title" style={{ marginTop: '24px' }}>Skills</div>
        {skills.length > 0 ? (
          <div className="profile-chips">
            {skills.map(s => <span key={s} className="skill-tag skill-tag-blue">{s}</span>)}
          </div>
        ) : (
          <p className="profile-info-value not-provided" style={{ marginTop: 4 }}>Not provided</p>
        )}

        <div className="profile-section-title" style={{ marginTop: '24px' }}>Interests</div>
        {interests.length > 0 ? (
          <div className="profile-chips">
            {interests.map(s => <span key={s} className="skill-tag">{s}</span>)}
          </div>
        ) : (
          <p className="profile-info-value not-provided" style={{ marginTop: 4 }}>Not provided</p>
        )}

        <div className="profile-section-title" style={{ marginTop: '24px' }}>Experience</div>
        {profile.experience
          ? <p className="profile-experience-text">{profile.experience}</p>
          : <p className="profile-info-value not-provided" style={{ marginTop: 4 }}>Not provided</p>
        }

        <div className="profile-section-title" style={{ marginTop: '24px' }}>Availability</div>
        {profile.availability
          ? <p className="profile-info-value" style={{ marginTop: 4 }}>{profile.availability}</p>
          : <p className="profile-info-value not-provided" style={{ marginTop: 4 }}>Not provided</p>
        }
      </div>
    </>
  );
};

/* ── Edit Form View ──────────────────────────────────────────── */
const ProfileEditView = ({ profile, completionPercent, onSave, onCancel }) => {
  const [formData, setFormData] = useState({ ...profile });
  const [saving, setSaving]     = useState(false);
  const [saveError, setSaveError] = useState('');
  const { currentUser } = useAuth();

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    if (saveError) setSaveError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true); setSaveError('');
    try {
      const token = await currentUser.getIdToken();
      const payload = {
        ...formData,
        skills:    formData.skills.split(',').map(s => s.trim()).filter(Boolean),
        interests: formData.interests.split(',').map(s => s.trim()).filter(Boolean),
      };
      const res = await fetch(`${API}/api/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('Failed to update profile');
      const updatedData = await res.json();
      // Pass the raw API response back so parent can re-derive form shape
      onSave(updatedData);
    } catch (err) {
      setSaveError('Error saving profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      {/* Header — same as read view but "editing" label instead of button */}
      <div className="profile-header-card">
        <div className="profile-header-top-row">
          <div className="profile-top">
            <div className="profile-avatar">{getInitial(formData.fullName)}</div>
            <div className="profile-identity">
              <div className="profile-name">{formData.fullName || 'Your Name'}</div>
              <div className="profile-email">{formData.collegeEmail}</div>
              {(formData.department || formData.year) && (
                <div className="profile-dept-year">
                  {formData.department}{formData.department && formData.year ? ' · ' : ''}{formData.year}
                </div>
              )}
            </div>
          </div>
          <span style={{ fontSize: 12, color: 'var(--blue)', fontWeight: 600, background: 'var(--blue-muted)', border: '1px solid var(--blue-border)', borderRadius: 'var(--r-full)', padding: '3px 10px', flexShrink: 0 }}>
            Editing
          </span>
        </div>
        <div className="completion-section">
          <span className="completion-label">Profile completion</span>
          <div className="completion-bar-wrap">
            <div className="completion-bar-fill" style={{ width: `${completionPercent}%` }} />
          </div>
          <span className="completion-pct">{completionPercent}%</span>
        </div>
      </div>

      {saveError && <div className="alert alert-error">{saveError}</div>}

      {/* Edit form */}
      <div className="profile-form-card">
        <form onSubmit={handleSubmit}>
          <div className="profile-section-title">Profile Information</div>
          <div className="profile-form-grid">
            <div className="profile-form-group">
              <label className="profile-form-label" htmlFor="fullName">Full Name</label>
              <input type="text" id="fullName" name="fullName"
                value={formData.fullName} onChange={handleChange} required />
            </div>

            <div className="profile-form-group">
              <label className="profile-form-label" htmlFor="collegeEmail">College Email</label>
              <div className="input-locked">
                <input type="email" id="collegeEmail" name="collegeEmail"
                  value={formData.collegeEmail} readOnly disabled
                  style={{ opacity: 0.5, cursor: 'not-allowed' }} />
                <span className="input-locked-badge">Locked</span>
              </div>
            </div>

            <div className="profile-form-group">
              <label className="profile-form-label" htmlFor="department">Department</label>
              <input type="text" id="department" name="department"
                placeholder="e.g. Computer Science"
                value={formData.department} onChange={handleChange} />
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

          <div className="profile-section-title" style={{ marginTop: '8px' }}>Skills &amp; Interests</div>
          <div className="profile-form-group full-width">
            <label className="profile-form-label" htmlFor="skills">Skills</label>
            <input type="text" id="skills" name="skills"
              placeholder="React, Node.js, Python, Figma..."
              value={formData.skills} onChange={handleChange} />
            <span className="profile-form-help">Separate with commas. Used for AI matching.</span>
          </div>
          <div className="profile-form-group full-width">
            <label className="profile-form-label" htmlFor="interests">Interests</label>
            <input type="text" id="interests" name="interests"
              placeholder="Machine Learning, Web Dev, UI/UX..."
              value={formData.interests} onChange={handleChange} />
            <span className="profile-form-help">Separate with commas.</span>
          </div>

          <div className="profile-section-title" style={{ marginTop: '8px' }}>Experience &amp; Availability</div>
          <div className="profile-form-group full-width">
            <label className="profile-form-label" htmlFor="experience">Experience</label>
            <textarea id="experience" name="experience" rows={4}
              placeholder="Describe your projects, internships, hackathons, certifications..."
              value={formData.experience} onChange={handleChange} />
          </div>
          <div className="profile-form-group full-width">
            <label className="profile-form-label" htmlFor="availability">Availability</label>
            <input type="text" id="availability" name="availability"
              placeholder="e.g. 10 hours/week, weekends only"
              value={formData.availability} onChange={handleChange} />
          </div>

          <div className="profile-form-actions">
            <button type="button" className="btn btn-secondary" onClick={onCancel} disabled={saving}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </>
  );
};

/* ── Main Profile Component ──────────────────────────────────── */
const Profile = () => {
  const { currentUser } = useAuth();

  const [loadState, setLoadState]   = useState('loading');   // 'loading' | 'error' | 'ready'
  const [profile, setProfile]       = useState(null);        // flat form-shape object
  const [savedProfile, setSavedProfile] = useState(null);   // snapshot for cancel
  const [completionPercent, setCompletionPercent] = useState(0);
  const [isEditing, setIsEditing]   = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const fetchProfile = useCallback(async () => {
    setLoadState('loading');
    setSuccessMsg('');
    try {
      const token = await currentUser.getIdToken();
      const res = await fetch(`${API}/api/profile`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      const flat = toFormData(data, currentUser);
      setProfile(flat);
      setSavedProfile(flat);
      setCompletionPercent(calculateCompletion(data));
      setLoadState('ready');
    } catch {
      setLoadState('error');
    }
  }, [currentUser]);

  useEffect(() => {
    if (currentUser) fetchProfile();
  }, [currentUser, fetchProfile]);

  // Auto-hide success message after 3 seconds
  useEffect(() => {
    if (!successMsg) return;
    const t = setTimeout(() => setSuccessMsg(''), 3000);
    return () => clearTimeout(t);
  }, [successMsg]);

  const handleEdit = () => {
    setSavedProfile({ ...profile }); // snapshot before editing
    setIsEditing(true);
    setSuccessMsg('');
  };

  const handleCancel = () => {
    setProfile({ ...savedProfile }); // restore snapshot
    setIsEditing(false);
  };

  const handleSave = (updatedApiData) => {
    const flat = toFormData(updatedApiData, currentUser);
    setProfile(flat);
    setSavedProfile(flat);
    setCompletionPercent(calculateCompletion(updatedApiData));
    setIsEditing(false);
    setSuccessMsg('Profile updated successfully.');
  };

  /* ── Loading ── */
  if (loadState === 'loading') return <ProfileSkeleton />;

  /* ── Error ── */
  if (loadState === 'error') {
    return (
      <>
        <Navbar />
        <div className="container profile-page">
          <Link to="/" className="profile-back-link">← Back to Home</Link>
          <div className="profile-layout">
            <div className="profile-error-card">
              <div className="profile-error-icon">⚠️</div>
              <div className="profile-error-msg">Unable to load your profile.</div>
              <p className="profile-error-hint">
                There was a problem connecting to the server. Please check your connection and try again.
              </p>
              <button className="btn btn-secondary" onClick={fetchProfile}>Retry</button>
            </div>
          </div>
        </div>
      </>
    );
  }

  /* ── Ready ── */
  return (
    <>
      <Navbar />
      <div className="container profile-page">
        <Link to="/" className="profile-back-link">← Back to Home</Link>

        <div className="profile-layout">
          {/* Success alert */}
          {successMsg && (
            <div className="alert alert-success">{successMsg}</div>
          )}

          {isEditing ? (
            <ProfileEditView
              profile={profile}
              completionPercent={completionPercent}
              onSave={handleSave}
              onCancel={handleCancel}
            />
          ) : (
            <ProfileReadView
              profile={profile}
              completionPercent={completionPercent}
              onEdit={handleEdit}
            />
          )}
        </div>
      </div>
    </>
  );
};

export default Profile;
