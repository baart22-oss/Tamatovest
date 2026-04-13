import React, { useEffect, useState } from 'react';
import api from '../utils/api';
import StatusBadge from '../components/StatusBadge';
import { Link } from 'react-router-dom';

const Investments = () => {
  const [investments, setInvestments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/api/investments')
      .then((res) => setInvestments(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const getDaysRemaining = (inv) => {
    if (inv.status !== 'active') return null;
    return 60 - (inv.days_elapsed || 0);
  };

  const getProgress = (inv) => {
    if (inv.status !== 'active') return 0;
    return Math.min(100, ((inv.days_elapsed || 0) / 60) * 100);
  };

  return (
    <div>
      <div className="section-title">My Investments</div>
      <p className="section-subtitle">Track all your active and past investments</p>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
          <div className="spinner" />
        </div>
      ) : investments.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <div className="icon">📦</div>
            <p style={{ marginBottom: '1rem' }}>You haven't made any investments yet</p>
            <Link to="/packages" className="btn btn-primary">
              View Investment Packages →
            </Link>
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {investments.map((inv) => {
            const daysRemaining = getDaysRemaining(inv);
            const progress = getProgress(inv);
            const earnedSoFar = (inv.days_elapsed || 0) * parseFloat(inv.daily_profit);

            return (
              <div className="card" key={inv.id}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                      <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>🍅 {inv.package_name}</h3>
                      <StatusBadge status={inv.status} />
                    </div>
                    <p style={{ color: 'var(--gray-600)', fontSize: '0.875rem' }}>
                      Invested on {new Date(inv.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--tomato-red)' }}>
                      R{parseFloat(inv.amount).toFixed(2)}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--gray-600)' }}>Investment Amount</div>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '1rem', margin: '1rem 0' }}>
                  <div style={{ textAlign: 'center', padding: '0.75rem', background: 'var(--green-light)', borderRadius: 8 }}>
                    <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--green-dark)' }}>
                      R{parseFloat(inv.daily_profit).toFixed(2)}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--green-dark)' }}>Daily Profit</div>
                  </div>
                  <div style={{ textAlign: 'center', padding: '0.75rem', background: '#fff7ed', borderRadius: 8 }}>
                    <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#c05621' }}>
                      R{earnedSoFar.toFixed(2)}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#c05621' }}>Earned So Far</div>
                  </div>
                  <div style={{ textAlign: 'center', padding: '0.75rem', background: '#ede9fe', borderRadius: 8 }}>
                    <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#6d28d9' }}>
                      R{parseFloat(inv.total_profit).toFixed(2)}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#6d28d9' }}>Total Profit</div>
                  </div>
                  {daysRemaining !== null && (
                    <div style={{ textAlign: 'center', padding: '0.75rem', background: '#dbeafe', borderRadius: 8 }}>
                      <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#1e40af' }}>
                        {daysRemaining}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#1e40af' }}>Days Remaining</div>
                    </div>
                  )}
                </div>

                {inv.status === 'active' && (
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--gray-600)', marginBottom: '0.25rem' }}>
                      <span>Progress: Day {inv.days_elapsed || 0} of 60</span>
                      <span>{progress.toFixed(0)}%</span>
                    </div>
                    <div className="progress-bar">
                      <div className="progress-fill" style={{ width: `${progress}%` }} />
                    </div>
                  </div>
                )}

                {inv.status === 'pending' && (
                  <div className="alert alert-info" style={{ marginTop: '0.75rem', marginBottom: 0 }}>
                    ⏳ Your proof of payment is being reviewed. Activation within 24 hours.
                  </div>
                )}
                {inv.status === 'rejected' && (
                  <div className="alert alert-error" style={{ marginTop: '0.75rem', marginBottom: 0 }}>
                    ❌ Your POP was rejected. Please contact support or reinvest.
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
        <Link to="/packages" className="btn btn-primary btn-lg">
          + Make New Investment
        </Link>
      </div>
    </div>
  );
};

export default Investments;
