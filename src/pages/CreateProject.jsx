import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './CreateProject.css';

const CreateProject = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    requiredSkills: '',
    category: '',
    teamSize: '',
    duration: ''
  });

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

    try {
      const token = await currentUser.getIdToken();
      
      const skillsArray = formData.requiredSkills
        .split(',')
        .map(s => s.trim())
        .filter(s => s !== '');

      if (skillsArray.length === 0) {
        throw new Error('Please enter at least one required skill');
      }

      const payload = {
        ...formData,
        requiredSkills: skillsArray,
        teamSize: parseInt(formData.teamSize, 10)
      };

      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/projects`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create project');
      }

      // Success - navigate to projects list
      navigate('/projects');
      
    } catch (err) {
      setError(err.message || 'Error creating project. Please try again.');
      setSaving(false);
    }
  };

  return (
    <div className="create-project-page container animate-fade-in">
      <div className="glass project-form-container">
        <div style={{ marginBottom: '2rem' }}>
          <Link to="/" className="btn btn-outline btn-sm">
            &larr; Back to Home
          </Link>
        </div>

        <div className="project-header">
          <h2>Create a New Project</h2>
          <p className="text-muted">Fill out the details to share your project idea and find teammates.</p>
        </div>

        {error && <div className="alert error">{error}</div>}

        <form className="project-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="title">Project Title *</label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="e.g. AI-Powered Study Assistant"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="description">Project Description *</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Describe your project, the problem it solves, and what you want to build..."
              rows="5"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="requiredSkills">Required Skills *</label>
            <input
              type="text"
              id="requiredSkills"
              name="requiredSkills"
              value={formData.requiredSkills}
              onChange={handleChange}
              placeholder="e.g. React, Node.js, Python, Figma"
              required
            />
            <span className="help-text">Separate skills with commas</span>
          </div>

          <div className="form-row">
            <div className="form-group half">
              <label htmlFor="category">Category *</label>
              <select
                id="category"
                name="category"
                value={formData.category}
                onChange={handleChange}
                required
              >
                <option value="">Select Category...</option>
                <option value="Web Development">Web Development</option>
                <option value="Mobile Development">Mobile Development</option>
                <option value="AI / Machine Learning">AI / Machine Learning</option>
                <option value="Data Science">Data Science</option>
                <option value="Cybersecurity">Cybersecurity</option>
                <option value="Cloud / DevOps">Cloud / DevOps</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div className="form-group half">
              <label htmlFor="teamSize">Team Size *</label>
              <input
                type="number"
                id="teamSize"
                name="teamSize"
                value={formData.teamSize}
                onChange={handleChange}
                placeholder="e.g. 4"
                min="1"
                max="20"
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="duration">Duration (Optional)</label>
            <select
              id="duration"
              name="duration"
              value={formData.duration}
              onChange={handleChange}
            >
              <option value="">Select Expected Duration...</option>
              <option value="2 Weeks">2 Weeks</option>
              <option value="1 Month">1 Month</option>
              <option value="2 Months">2 Months</option>
              <option value="3 Months">3 Months</option>
              <option value="6 Months">6 Months</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div className="project-actions">
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Creating Project...' : 'Create Project'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateProject;
