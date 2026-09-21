import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './Auth.css';

const SignUp = () => {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const { signup } = useAuth();
  const navigate = useNavigate();

  const validate = () => {
    const newErrors = {};
    if (!formData.fullName.trim()) newErrors.fullName = 'Full name is required';
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Invalid email address';
    }
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Must be at least 8 characters';
    } else if (!/\d/.test(formData.password)) {
      newErrors.password = 'Must contain at least one number';
    }
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
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
      await signup(formData.email, formData.password, formData.fullName);
      navigate('/');
    } catch (err) {
      if (err.code === 'auth/email-already-in-use') {
        setFormError('An account with this email already exists.');
      } else if (err.code === 'auth/invalid-email') {
        setFormError('Invalid email address format.');
      } else if (err.code === 'auth/weak-password') {
        setFormError('Password is too weak.');
      } else {
        setFormError('Failed to create account. Please try again.');
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
            <h1 className="auth-title">Create your account</h1>
            <p className="auth-subtitle">Build your profile. Find your team.</p>
          </div>

          {formError && (
            <div className="auth-error-alert">
              <span>⚠</span> {formError}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate>
            <div className="auth-input-group">
              <label className="auth-input-label" htmlFor="fullName">Full name</label>
              <input
                type="text"
                id="fullName"
                name="fullName"
                placeholder="Your full name"
                value={formData.fullName}
                onChange={handleChange}
                disabled={loading}
                className={errors.fullName ? 'input-error' : ''}
              />
              {errors.fullName && <span className="auth-field-error">{errors.fullName}</span>}
            </div>

            <div className="auth-input-group">
              <label className="auth-input-label" htmlFor="email">College email</label>
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
                  placeholder="Min. 8 characters with a number"
                  value={formData.password}
                  onChange={handleChange}
                  disabled={loading}
                  className={errors.password ? 'input-error' : ''}
                />
                <button type="button" className="auth-input-action" onClick={() => setShowPassword(!showPassword)} disabled={loading}>
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
              {errors.password && <span className="auth-field-error">{errors.password}</span>}
            </div>

            <div className="auth-input-group">
              <label className="auth-input-label" htmlFor="confirmPassword">Confirm password</label>
              <div className="auth-input-wrapper">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  id="confirmPassword"
                  name="confirmPassword"
                  placeholder="••••••••"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  disabled={loading}
                  className={errors.confirmPassword ? 'input-error' : ''}
                />
                <button type="button" className="auth-input-action" onClick={() => setShowConfirmPassword(!showConfirmPassword)} disabled={loading}>
                  {showConfirmPassword ? 'Hide' : 'Show'}
                </button>
              </div>
              {errors.confirmPassword && <span className="auth-field-error">{errors.confirmPassword}</span>}
            </div>

            <button type="submit" className="btn btn-primary auth-submit-btn" disabled={loading}>
              {loading ? 'Creating account...' : 'Create account'}
            </button>
          </form>

          <div className="auth-footer">
            Already have an account?{' '}
            <Link to="/login">Sign in</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignUp;
