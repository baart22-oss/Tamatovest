import React, { useEffect, useState } from 'react';
import api from '../../utils/api';
import toast from 'react-hot-toast';

const AdminOverview = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  const fetchStats = async () => {
    try {
      const res = await api.get('/api/admin/stats');
      setStats(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchStats(); }, []);

  const processDailyProfits = async () => {
    if (!window.confirm('Process daily profits for all active investments?')) return;
    setProcessing(true);
    try {
      const res = await api.post('/api/admin/daily-profits');
      toast.success(`Processed ${res.data.processed} investments`);
      fetchStats();
    } catch (err) {
      toast.error('Failed to process daily profits');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) return <div className="loading-page"><div className="spinner" /></div>;

  return (
    <div>
      <div className="section-title">Admin Dashboard</div>
      <p className="section-subtitle">Platform overview and management</p>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon blue">👥</div>
          <div>
            <div className="stat-value">{stats?.totalUsers || 0}</div>
            <div className="stat-label">Total Users</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon green">💰</div>
          <div>
            <div className="stat-value">R{(stats?.totalInvested || 0).toLocaleString()}</div>
            <div className="stat-label">Total Invested</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon red">⏳</div>
          <div>
            <div className="stat-value">{stats?.pendingPops || 0}</div>
            <div className="stat-label">Pending POPs</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon orange">💸</div>
          <div>
            <div className="stat-value">{stats?.pendingWithdrawals || 0}</div>
            <div className="stat-label">Pending Withdrawals</div>
          </div>
        </div>
      </div>

      <div className="card" style={{ marginTop: '1.5rem' }}>
        <div className="card-title" style={{ marginBottom: '1rem' }}>Admin Actions</div>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <button
            className="btn btn-green"
            onClick={processDailyProfits}
            disabled={processing}
          >
            {processing ? '⏳ Processing...' : '📈 Process Daily Profits'}
          </button>
        </div>
        <p className="text-sm text-gray" style={{ marginTop: '0.75rem' }}>
          ⚠️ Run "Process Daily Profits" once per day to credit earnings to active investors.
          In production, this should be automated via a cron job.
        </p>
      </div>
    </div>
  );
};

export default AdminOverview;
