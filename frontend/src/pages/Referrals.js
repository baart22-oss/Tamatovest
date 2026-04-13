import React, { useEffect, useState } from 'react';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const Referrals = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    api.get('/api/referrals/stats')
      .then((res) => setStats(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const referralLink = `${window.location.origin}/register?ref=${user?.referral_code}`;

  const copyLink = () => {
    navigator.clipboard.writeText(referralLink).then(() => {
      setCopied(true);
      toast.success('Referral link copied!');
      setTimeout(() => setCopied(false), 2000);
    });
  };

  if (loading) return <div className="loading-page"><div className="spinner" /></div>;

  return (
    <div>
      <div className="section-title">Referral Program</div>
      <p className="section-subtitle">Earn commissions by inviting friends to invest</p>

      {/* Commission structure */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
        <div className="referral-tier l1">
          <h4>🏆 Level 1</h4>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--tomato-red)' }}>12%</div>
          <p className="text-sm text-gray">Direct referrals</p>
          {stats && <p className="text-sm font-semibold" style={{ marginTop: '0.5rem' }}>
            {stats.levels[1].count} referrals · R{stats.levels[1].totalCommission.toFixed(2)} earned
          </p>}
        </div>
        <div className="referral-tier l2">
          <h4>🥈 Level 2</h4>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--green)' }}>5%</div>
          <p className="text-sm text-gray">2nd degree referrals</p>
          {stats && <p className="text-sm font-semibold" style={{ marginTop: '0.5rem' }}>
            {stats.levels[2].count} referrals · R{stats.levels[2].totalCommission.toFixed(2)} earned
          </p>}
        </div>
        <div className="referral-tier l3">
          <h4>🥉 Level 3</h4>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: '#3b82f6' }}>1%</div>
          <p className="text-sm text-gray">3rd degree referrals</p>
          {stats && <p className="text-sm font-semibold" style={{ marginTop: '0.5rem' }}>
            {stats.levels[3].count} referrals · R{stats.levels[3].totalCommission.toFixed(2)} earned
          </p>}
        </div>
      </div>

      {/* Total earned */}
      {stats && (
        <div className="stat-card" style={{ marginBottom: '1.5rem', background: 'linear-gradient(135deg, var(--tomato-red), var(--tomato-dark))', color: 'white', border: 'none' }}>
          <div className="stat-icon" style={{ background: 'rgba(255,255,255,0.2)' }}>🤝</div>
          <div>
            <div className="stat-value" style={{ color: 'white' }}>R{stats.totalCommission.toFixed(2)}</div>
            <div className="stat-label" style={{ color: 'rgba(255,255,255,0.8)' }}>Total Referral Earnings</div>
          </div>
        </div>
      )}

      {/* Referral link */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div className="card-title" style={{ marginBottom: '1rem' }}>Your Referral Link</div>
        <div style={{ marginBottom: '1rem' }}>
          <div className="form-label">Referral Code</div>
          <div className="copy-field">
            <code>{user?.referral_code}</code>
            <button className="btn btn-sm btn-primary" onClick={copyLink}>
              {copied ? '✅ Copied!' : '📋 Copy'}
            </button>
          </div>
        </div>
        <div>
          <div className="form-label">Referral Link</div>
          <div className="copy-field">
            <code style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {referralLink}
            </code>
            <button className="btn btn-sm btn-primary" onClick={copyLink}>
              {copied ? '✅ Copied!' : '🔗 Copy'}
            </button>
          </div>
        </div>
        <p className="text-sm text-gray" style={{ marginTop: '0.75rem' }}>
          Share this link with friends. When they invest, you earn commissions automatically!
        </p>
      </div>

      {/* Level 1 referrals table */}
      {stats && stats.levels[1].referrals.length > 0 && (
        <div className="card">
          <div className="card-title" style={{ marginBottom: '1rem' }}>Direct Referrals (Level 1)</div>
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Joined</th>
                  <th>Commission Earned</th>
                </tr>
              </thead>
              <tbody>
                {stats.levels[1].referrals.map((ref) => (
                  <tr key={ref.id}>
                    <td className="font-semibold">{ref.name}</td>
                    <td className="text-gray">{ref.email}</td>
                    <td className="text-gray text-sm">{new Date(ref.created_at).toLocaleDateString()}</td>
                    <td className="text-green font-semibold">R{parseFloat(ref.commission_earned).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {stats && stats.levels[1].referrals.length === 0 && (
        <div className="card">
          <div className="empty-state">
            <div className="icon">🤝</div>
            <p>No referrals yet. Start sharing your link!</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Referrals;
