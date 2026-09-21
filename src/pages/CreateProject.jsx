import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Navbar from '../components/Navbar';
import { API_URL as API } from '../config';
import './CreateProject.css';

const CreateProject = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    title: '', description: '', requiredSkills: '',
    category: '', teamSize: '', duration: ''
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true); setError('');
    try {
      const token = await currentUser.getIdToken();
      const skillsArray = formData.requiredSkills.split(',').map(s => s.trim()).filter(Boolean);
      if (skillsArray.length === 0) throw new Error('Please enter at least one required skill');
      const payload = { ...formData, requiredSkills: skillsArray, teamSize: parseInt(formData.teamSize, 10) };
      const res = await fetch(`${API}/api/projects`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload)
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.message || 'Failed to create project'); }
      navigate('/projects');
    } catch (err) {
      setError(err.message || 'Error creating project. Please try again.');
      setSaving(false);
    }
  };

  return (
    <>
      <Navbar />
      <div className="container create-project-page">
        <div className="create-project-layout">
          <div className="create-project-card">
            <div className="create-project-header">
              <h1>Create a New Project</h1>
              <p>Share your project idea and find the right teammates with AI-powered matching.</p>
            </div>

            {error && <div className="alert alert-error">{error}</div>}

            <form onSubmit={handleSubmit}>
              <div className="create-project-section-title">Project Details</div>

              <div className="form-group">
                <label className="form-label" htmlFor="title">Project Title <span style={{ color: 'var(--red)' }}>*</span></label>
                <input
                  type="text" id="title" name="title"
                  placeholder="e.g. AI-Powered Study Assistant"
                  value={formData.title} onChange={handleChange} required
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="description">Description <span style={{ color: 'var(--red)' }}>*</span></label>
                <textarea
                  id="description" name="description" rows={5}
                  placeholder="Describe your project: what problem it solves, what you'll build, and what kind of teammates you're looking for..."
                  value={formData.description} onChange={handleChange} required
                />
              </div>

              <div className="create-project-section-title">Team Requirements</div>

              <div className="form-group">
                <label className="form-label" htmlFor="requiredSkills">Required Skills <span style={{ color: 'var(--red)' }}>*</span></label>
                <input
                  type="text" id="requiredSkills" name="requiredSkills"
                  placeholder="e.g. React, Node.js, Python, Figma"
                  value={formData.requiredSkills} onChange={handleChange} required
                />
                <span className="form-help">Separate skills with commas. These are used for AI team matching.</span>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label" htmlFor="category">Category <span style={{ color: 'var(--red)' }}>*</span></label>
                  <select id="category" name="category" value={formData.category} onChange={handleChange} required>
                    <option value="">Select category...</option>
                    <option value="Web Development">Web Development</option>
                    <option value="Mobile Development">Mobile Development</option>
                    <option value="AI / Machine Learning">AI / Machine Learning</option>
                    <option value="Data Science">Data Science</option>
                    <option value="Cybersecurity">Cybersecurity</option>
                    <option value="Cloud / DevOps">Cloud / DevOps</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="teamSize">Team Size <span style={{ color: 'var(--red)' }}>*</span></label>
                  <input
                    type="number" id="teamSize" name="teamSize"
                    placeholder="e.g. 4" min="1" max="20"
                    value={formData.teamSize} onChange={handleChange} required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="duration">Duration <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(optional)</span></label>
                <select id="duration" name="duration" value={formData.duration} onChange={handleChange}>
                  <option value="">Select expected duration...</option>
                  <option value="2 Weeks">2 Weeks</option>
                  <option value="1 Month">1 Month</option>
                  <option value="2 Months">2 Months</option>
                  <option value="3 Months">3 Months</option>
                  <option value="6 Months">6 Months</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="create-project-actions">
                <Link to="/projects" className="btn btn-secondary">Cancel</Link>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Creating...' : 'Create Project'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
};

export default CreateProject;
