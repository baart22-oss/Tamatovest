import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const Login = () => {
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await login(form.email, form.password);
      toast.success(`Welcome back, ${user.name}!`);
      navigate(user.role === 'admin' ? '/admin' : '/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-left">
        <div style={{ maxWidth: 400, textAlign: 'center' }}>
          <div style={{ fontSize: '5rem', marginBottom: '1rem' }}>🍅</div>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '1rem' }}>
            Tamatovest
          </h1>
          <p style={{ opacity: 0.9, fontSize: '1.1rem', lineHeight: 1.7 }}>
            Grow your wealth with smart tomato investments. 5% daily returns, 
            powered by agriculture.
          </p>
          <div className="hero-stats" style={{ marginTop: '2rem' }}>
            <div className="hero-stat">
              <div className="num">5%</div>
              <div className="lbl">Daily Returns</div>
            </div>
            <div className="hero-stat">
              <div className="num">60</div>
              <div className="lbl">Day Duration</div>
            </div>
            <div className="hero-stat">
              <div className="num">13</div>
              <div className="lbl">Packages</div>
            </div>
          </div>
        </div>
      </div>

      <div className="auth-right">
        <div className="auth-card">
          <div className="auth-logo">
            <div className="auth-logo-icon">🍅</div>
            <div>
              <div style={{ fontWeight: 800, fontSize: '1.25rem', color: 'var(--gray-800)' }}>Tamatovest</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--gray-600)' }}>Investment Platform</div>
            </div>
          </div>
          <h2 className="auth-title">Welcome back</h2>
          <p className="auth-subtitle">Sign in to your account to continue</p>

          {error && <div className="alert alert-error">{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input
                type="email"
                className="form-control"
                placeholder="Enter your email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Password</label>
              <input
                type="password"
                className="form-control"
                placeholder="Enter your password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required
              />
            </div>
            <button className="btn btn-primary btn-block btn-lg" type="submit" disabled={loading}>
              {loading ? 'Signing in...' : '🔑 Sign In'}
            </button>
          </form>

          <div className="divider" />
          <p style={{ textAlign: 'center', fontSize: '0.9rem', color: 'var(--gray-600)' }}>
            Don't have an account?{' '}
            <Link to="/register" style={{ color: 'var(--tomato-red)', fontWeight: 600 }}>
              Create one
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
