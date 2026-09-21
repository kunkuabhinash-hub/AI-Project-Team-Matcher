import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';
import './Profile.css';

const Profile = () => {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState({
    fullName: '',
    collegeEmail: '',
    department: '',
    year: '',
    skills: '',
    interests: '',
    experience: '',
    availability: ''
  });
  
  const [completionPercent, setCompletionPercent] = useState(0);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = await currentUser.getIdToken();
        const response = await fetch('http://localhost:5000/api/profile', {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        if (!response.ok) {
          throw new Error('Failed to fetch profile');
        }

        const data = await response.json();
        
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
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    if (currentUser) {
      fetchProfile();
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

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const token = await currentUser.getIdToken();
      
      const skillsArray = formData.skills.split(',').map(s => s.trim()).filter(s => s !== '');
      const interestsArray = formData.interests.split(',').map(s => s.trim()).filter(s => s !== '');

      const payload = {
        ...formData,
        skills: skillsArray,
        interests: interestsArray
      };

      const response = await fetch('http://localhost:5000/api/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error('Failed to update profile');
      }

      const updatedData = await response.json();
      setSuccess('Profile updated successfully!');
      calculateCompletion(updatedData);
      
    } catch (err) {
      setError('Error saving profile. Please try again.');
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="profile-page container">
        <div className="glass profile-container" style={{ textAlign: 'center' }}>
          <p>Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-page container animate-fade-in">
      <div className="glass profile-container">
        
        <div style={{ marginBottom: '2rem' }}>
          <Link to="/" className="btn btn-outline btn-sm">
            &larr; Back to Home
          </Link>
        </div>

        <div className="profile-header">
          <h2>Your Profile</h2>
          <p className="text-muted">Complete your profile to get better project matches</p>
          
          <div className="completion-bar-container">
            <p>Profile Completion: {completionPercent}%</p>
            <div className="completion-bar-bg">
              <div 
                className="completion-bar-fill" 
                style={{ width: `${completionPercent}%` }}
              ></div>
            </div>
          </div>
        </div>

        {error && <div className="alert error">{error}</div>}
        {success && <div className="alert success">{success}</div>}

        <form className="profile-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="fullName">Full Name</label>
            <input
              type="text"
              id="fullName"
              name="fullName"
              value={formData.fullName}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="collegeEmail">College Email</label>
            <input
              type="email"
              id="collegeEmail"
              name="collegeEmail"
              value={formData.collegeEmail}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="department">Department</label>
            <input
              type="text"
              id="department"
              name="department"
              placeholder="e.g. Computer Science"
              value={formData.department}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label htmlFor="year">Year of Study</label>
            <select
              id="year"
              name="year"
              value={formData.year}
              onChange={handleChange}
            >
              <option value="">Select Year...</option>
              <option value="1st Year">1st Year</option>
              <option value="2nd Year">2nd Year</option>
              <option value="3rd Year">3rd Year</option>
              <option value="4th Year">4th Year</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="skills">Skills</label>
            <input
              type="text"
              id="skills"
              name="skills"
              placeholder="React, Node.js, Python..."
              value={formData.skills}
              onChange={handleChange}
            />
            <span className="help-text">Separate skills with commas</span>
          </div>

          <div className="form-group">
            <label htmlFor="interests">Interests</label>
            <input
              type="text"
              id="interests"
              name="interests"
              placeholder="Machine Learning, Web Dev, UI/UX..."
              value={formData.interests}
              onChange={handleChange}
            />
            <span className="help-text">Separate interests with commas</span>
          </div>

          <div className="form-group">
            <label htmlFor="experience">Experience</label>
            <textarea
              id="experience"
              name="experience"
              placeholder="Describe your projects, internships, hackathons, certifications, or other relevant experience..."
              value={formData.experience}
              onChange={handleChange}
              rows="4"
            />
          </div>

          <div className="form-group">
            <label htmlFor="availability">Availability</label>
            <input
              type="text"
              id="availability"
              name="availability"
              placeholder="e.g. 10 hours/week"
              value={formData.availability}
              onChange={handleChange}
            />
          </div>

          <div className="profile-actions">
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Saving...' : 'Save Profile'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Profile;
