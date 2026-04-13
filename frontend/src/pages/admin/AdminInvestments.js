import React, { useEffect, useState } from 'react';
import api from '../../utils/api';
import StatusBadge from '../../components/StatusBadge';
import toast from 'react-hot-toast';

const AdminInvestments = () => {
  const [investments, setInvestments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('pending');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [actionLoading, setActionLoading] = useState(null);
  const [viewPop, setViewPop] = useState(null);
  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

  const fetchInvestments = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: 20 });
      if (filter) params.set('status', filter);
      const res = await api.get(`/api/admin/investments?${params}`);
      setInvestments(res.data.investments);
      setTotal(res.data.total);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchInvestments(); }, [page, filter]); // eslint-disable-line

  const handleApprove = async (id) => {
    if (!window.confirm('Approve this investment and activate it?')) return;
    setActionLoading(id);
    try {
      await api.put(`/api/admin/investments/${id}/approve`);
      toast.success('Investment approved!');
      fetchInvestments();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to approve');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (id) => {
    const reason = window.prompt('Reason for rejection (optional):');
    if (reason === null) return;
    setActionLoading(id);
    try {
      await api.put(`/api/admin/investments/${id}/reject`, { reason });
      toast.success('Investment rejected');
      fetchInvestments();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to reject');
    } finally {
      setActionLoading(null);
    }
  };

  const totalPages = Math.ceil(total / 20);

  return (
    <div>
      <div className="section-title">Manage Investments / POPs</div>
      <p className="section-subtitle">Review and approve proof of payment submissions</p>

      {/* POP viewer modal */}
      {viewPop && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          onClick={() => setViewPop(null)}
        >
          <div style={{ background: 'white', borderRadius: 12, padding: '1rem', maxWidth: '90vw', maxHeight: '90vh', overflow: 'auto' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <h3>Proof of Payment</h3>
              <button className="btn btn-ghost btn-sm" onClick={() => setViewPop(null)}>✕ Close</button>
            </div>
            {viewPop.endsWith('.pdf') ? (
              <iframe src={`${API_URL}${viewPop}`} title="POP" style={{ width: '70vw', height: '80vh' }} />
            ) : (
              <img src={`${API_URL}${viewPop}`} alt="Proof of Payment" style={{ maxWidth: '70vw', maxHeight: '80vh', objectFit: 'contain' }} />
            )}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="card" style={{ marginBottom: '1rem' }}>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {['pending', 'active', 'completed', 'rejected', ''].map((s) => (
            <button
              key={s}
              className={`btn btn-sm ${filter === s ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => { setFilter(s); setPage(1); }}
            >
              {s === '' ? 'All' : s}
            </button>
          ))}
        </div>
      </div>

      <div className="card">
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}>
            <div className="spinner" />
          </div>
        ) : investments.length === 0 ? (
          <div className="empty-state">
            <div className="icon">📋</div>
            <p>No investments found</p>
          </div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>User</th>
                  <th>Package</th>
                  <th>Amount</th>
                  <th>Daily</th>
                  <th>POP</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {investments.map((inv) => (
                  <tr key={inv.id}>
                    <td>
                      <div className="font-semibold">{inv.user_name}</div>
                      <div className="text-xs text-gray">{inv.user_email}</div>
                    </td>
                    <td>🍅 {inv.package_name}</td>
                    <td className="font-semibold">R{parseFloat(inv.amount).toFixed(2)}</td>
                    <td className="text-green">+R{parseFloat(inv.daily_profit).toFixed(2)}</td>
                    <td>
                      {inv.pop_image_url ? (
                        <button className="btn btn-sm btn-ghost" onClick={() => setViewPop(inv.pop_image_url)}>
                          🔍 View POP
                        </button>
                      ) : (
                        <span className="text-gray text-sm">No file</span>
                      )}
                    </td>
                    <td><StatusBadge status={inv.status} /></td>
                    <td className="text-sm text-gray">{new Date(inv.created_at).toLocaleDateString()}</td>
                    <td>
                      {inv.status === 'pending' && (
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button
                            className="btn btn-sm btn-green"
                            onClick={() => handleApprove(inv.id)}
                            disabled={actionLoading === inv.id}
                          >
                            ✅
                          </button>
                          <button
                            className="btn btn-sm btn-primary"
                            onClick={() => handleReject(inv.id)}
                            disabled={actionLoading === inv.id}
                          >
                            ❌
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {totalPages > 1 && (
          <div className="pagination">
            <button className="page-btn" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>←</button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => i + 1).map((p) => (
              <button key={p} className={`page-btn ${page === p ? 'active' : ''}`} onClick={() => setPage(p)}>{p}</button>
            ))}
            <button className="page-btn" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>→</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminInvestments;
