import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import StatusBadge from '../components/StatusBadge';

const Dashboard = () => {
  const { user, refreshUser } = useAuth();
  const [investments, setInvestments] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [invRes, txRes] = await Promise.all([
          api.get('/api/investments'),
          api.get('/api/transactions?limit=5'),
        ]);
        setInvestments(invRes.data);
        setTransactions(txRes.data.transactions);
      } catch (err) {
        console.error('Dashboard fetch error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
    refreshUser();
  }, []); // eslint-disable-line

  const activeInvestments = investments.filter((i) => i.status === 'active');
  const totalDailyEarnings = activeInvestments.reduce((sum, i) => sum + parseFloat(i.daily_profit), 0);
  const pendingInvestments = investments.filter((i) => i.status === 'pending');

  return (
    <div>
      <div className="section-title">Dashboard</div>
      <p className="section-subtitle">Welcome back, {user?.name}! Here's your portfolio overview.</p>

      {/* Stats */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon green">💰</div>
          <div>
            <div className="stat-value">R{parseFloat(user?.balance || 0).toFixed(2)}</div>
            <div className="stat-label">Available Balance</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon red">📈</div>
          <div>
            <div className="stat-value">R{totalDailyEarnings.toFixed(2)}</div>
            <div className="stat-label">Daily Earnings</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon blue">🏆</div>
          <div>
            <div className="stat-value">R{parseFloat(user?.total_earned || 0).toFixed(2)}</div>
            <div className="stat-label">Total Earned</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon purple">📦</div>
          <div>
            <div className="stat-value">{activeInvestments.length}</div>
            <div className="stat-label">Active Investments</div>
          </div>
        </div>
      </div>

      {/* Alerts */}
      {pendingInvestments.length > 0 && (
        <div className="alert alert-info">
          📋 You have {pendingInvestments.length} investment(s) awaiting POP approval.
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        {/* Recent Investments */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">Recent Investments</span>
            <Link to="/investments" className="btn btn-ghost btn-sm">View All →</Link>
          </div>
          {loading ? (
            <div className="spinner" style={{ margin: '2rem auto' }} />
          ) : investments.length === 0 ? (
            <div className="empty-state">
              <div className="icon">📦</div>
              <p>No investments yet</p>
              <Link to="/packages" className="btn btn-primary btn-sm" style={{ marginTop: '1rem' }}>
                Start Investing
              </Link>
            </div>
          ) : (
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Package</th>
                    <th>Amount</th>
                    <th>Daily</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {investments.slice(0, 5).map((inv) => (
                    <tr key={inv.id}>
                      <td className="font-semibold">{inv.package_name}</td>
                      <td>R{parseFloat(inv.amount).toFixed(2)}</td>
                      <td className="text-green">+R{parseFloat(inv.daily_profit).toFixed(2)}</td>
                      <td><StatusBadge status={inv.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Recent Transactions */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">Recent Transactions</span>
            <Link to="/transactions" className="btn btn-ghost btn-sm">View All →</Link>
          </div>
          {loading ? (
            <div className="spinner" style={{ margin: '2rem auto' }} />
          ) : transactions.length === 0 ? (
            <div className="empty-state">
              <div className="icon">💳</div>
              <p>No transactions yet</p>
            </div>
          ) : (
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Type</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((tx) => (
                    <tr key={tx.id}>
                      <td style={{ textTransform: 'capitalize', fontSize: '0.8rem' }}>
                        {tx.type.replace('_', ' ')}
                      </td>
                      <td className={tx.type === 'withdrawal' ? 'text-red' : 'text-green'}>
                        {tx.type === 'withdrawal' ? '-' : '+'}R{parseFloat(tx.amount).toFixed(2)}
                      </td>
                      <td><StatusBadge status={tx.status} /></td>
                      <td style={{ fontSize: '0.75rem', color: 'var(--gray-600)' }}>
                        {new Date(tx.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card" style={{ marginTop: '1.5rem' }}>
        <div className="card-title" style={{ marginBottom: '1rem' }}>Quick Actions</div>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <Link to="/packages" className="btn btn-primary">📦 New Investment</Link>
          <Link to="/withdraw" className="btn btn-green">💸 Withdraw Funds</Link>
          <Link to="/referrals" className="btn btn-outline">🤝 Refer & Earn</Link>
          <Link to="/transactions" className="btn btn-ghost">💳 Transactions</Link>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
