import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './Auth.css';

const Login = () => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const validate = () => {
    const newErrors = {};
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Invalid email address';
    }
    if (!formData.password) {
      newErrors.password = 'Password is required';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (errors[e.target.name]) setErrors({ ...errors, [e.target.name]: '' });
    if (formError) setFormError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    try {
      setFormError('');
      setLoading(true);
      await login(formData.email, formData.password);
      navigate('/');
    } catch (err) {
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        setFormError('Invalid email or password.');
      } else if (err.code === 'auth/too-many-requests') {
        setFormError('Too many attempts. Please try again later.');
      } else {
        setFormError('Failed to sign in. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">

        <Link to="/" className="auth-logo-link">
          <div className="auth-logo-mark">T</div>
          <span className="auth-logo-text">TeamMatcher</span>
        </Link>

        <div className="auth-card">
          <div className="auth-header">
            <h1 className="auth-title">Welcome back</h1>
            <p className="auth-subtitle">Sign in to continue building your team</p>
          </div>

          {formError && (
            <div className="auth-error-alert">
              <span>⚠</span> {formError}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate>
            <div className="auth-input-group">
              <label className="auth-input-label" htmlFor="email">Email address</label>
              <input
                type="email"
                id="email"
                name="email"
                placeholder="you@university.edu"
                value={formData.email}
                onChange={handleChange}
                disabled={loading}
                className={errors.email ? 'input-error' : ''}
              />
              {errors.email && <span className="auth-field-error">{errors.email}</span>}
            </div>

            <div className="auth-input-group">
              <label className="auth-input-label" htmlFor="password">Password</label>
              <div className="auth-input-wrapper">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  name="password"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleChange}
                  disabled={loading}
                  className={errors.password ? 'input-error' : ''}
                />
                <button
                  type="button"
                  className="auth-input-action"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={loading}
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
              {errors.password && <span className="auth-field-error">{errors.password}</span>}
            </div>

            <button type="submit" className="btn btn-primary auth-submit-btn" disabled={loading}>
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>

          <div className="auth-footer">
            New to TeamMatcher?{' '}
            <Link to="/signup">Create an account</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
