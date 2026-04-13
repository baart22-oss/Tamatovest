import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const Register = () => {
  const [searchParams] = useSearchParams();
  const [form, setForm] = useState({
    name: '', email: '', password: '', phone: '',
    referralCode: searchParams.get('ref') || '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.password.length < 6) {
      return setError('Password must be at least 6 characters');
    }
    setLoading(true);
    try {
      const user = await register(form);
      toast.success(`Welcome to Tamatovest, ${user.name}!`);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed');
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
            Join Tamatovest
          </h1>
          <p style={{ opacity: 0.9, fontSize: '1.1rem', lineHeight: 1.7 }}>
            Start earning 5% daily returns on your investment. 
            Choose from 13 packages starting at just R80.
          </p>
          <div style={{ marginTop: '2rem', background: 'rgba(255,255,255,0.1)', borderRadius: 12, padding: '1.5rem' }}>
            <h3 style={{ marginBottom: '1rem', fontWeight: 700 }}>Referral Bonuses</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', textAlign: 'left' }}>
              <div>🏆 Level 1: <strong>12%</strong> commission</div>
              <div>🥈 Level 2: <strong>5%</strong> commission</div>
              <div>🥉 Level 3: <strong>1%</strong> commission</div>
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
          <h2 className="auth-title">Create account</h2>
          <p className="auth-subtitle">Join thousands of investors growing their wealth</p>

          {error && <div className="alert alert-error">{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input
                type="text"
                className="form-control"
                placeholder="Enter your full name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
            </div>
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
              <label className="form-label">Phone Number <span style={{ color: 'var(--gray-400)', fontWeight: 400 }}>(optional)</span></label>
              <input
                type="tel"
                className="form-control"
                placeholder="+27 xx xxx xxxx"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Password</label>
              <input
                type="password"
                className="form-control"
                placeholder="Min. 6 characters"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Referral Code <span style={{ color: 'var(--gray-400)', fontWeight: 400 }}>(optional)</span></label>
              <input
                type="text"
                className="form-control"
                placeholder="Enter referral code"
                value={form.referralCode}
                onChange={(e) => setForm({ ...form, referralCode: e.target.value.toUpperCase() })}
              />
            </div>
            <button className="btn btn-primary btn-block btn-lg" type="submit" disabled={loading}>
              {loading ? 'Creating account...' : '🚀 Create Account'}
            </button>
          </form>

          <div className="divider" />
          <p style={{ textAlign: 'center', fontSize: '0.9rem', color: 'var(--gray-600)' }}>
            Already have an account?{' '}
            <Link to="/login" style={{ color: 'var(--tomato-red)', fontWeight: 600 }}>
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
