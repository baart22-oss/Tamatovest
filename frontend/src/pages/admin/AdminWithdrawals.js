import React, { useEffect, useState } from 'react';
import api from '../../utils/api';
import StatusBadge from '../../components/StatusBadge';
import toast from 'react-hot-toast';

const AdminWithdrawals = () => {
  const [withdrawals, setWithdrawals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('pending');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [actionLoading, setActionLoading] = useState(null);

  const fetchWithdrawals = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: 20 });
      if (filter) params.set('status', filter);
      const res = await api.get(`/api/admin/withdrawals?${params}`);
      setWithdrawals(res.data.withdrawals);
      setTotal(res.data.total);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchWithdrawals(); }, [page, filter]); // eslint-disable-line

  const handleApprove = async (id) => {
    if (!window.confirm('Approve this withdrawal? Funds will be marked as paid.')) return;
    setActionLoading(id);
    try {
      await api.put(`/api/admin/withdrawals/${id}/approve`);
      toast.success('Withdrawal approved!');
      fetchWithdrawals();
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
      await api.put(`/api/admin/withdrawals/${id}/reject`, { reason });
      toast.success('Withdrawal rejected & balance refunded');
      fetchWithdrawals();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to reject');
    } finally {
      setActionLoading(null);
    }
  };

  const totalPages = Math.ceil(total / 20);

  return (
    <div>
      <div className="section-title">Manage Withdrawals</div>
      <p className="section-subtitle">Review and process withdrawal requests</p>

      {/* Filters */}
      <div className="card" style={{ marginBottom: '1rem' }}>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {['pending', 'approved', 'rejected', ''].map((s) => (
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
        ) : withdrawals.length === 0 ? (
          <div className="empty-state">
            <div className="icon">💸</div>
            <p>No withdrawals found</p>
          </div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>User</th>
                  <th>Amount</th>
                  <th>Bank</th>
                  <th>Account</th>
                  <th>Branch</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {withdrawals.map((w) => (
                  <tr key={w.id}>
                    <td>
                      <div className="font-semibold">{w.user_name}</div>
                      <div className="text-xs text-gray">{w.user_email}</div>
                    </td>
                    <td className="font-semibold text-red">R{parseFloat(w.amount).toFixed(2)}</td>
                    <td>{w.bank_name}</td>
                    <td>
                      <div>{w.account_holder}</div>
                      <div className="text-xs text-gray">{w.account_number}</div>
                    </td>
                    <td className="text-sm">{w.branch_code}</td>
                    <td><StatusBadge status={w.status} /></td>
                    <td className="text-sm text-gray">{new Date(w.created_at).toLocaleDateString()}</td>
                    <td>
                      {w.status === 'pending' && (
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button className="btn btn-sm btn-green" onClick={() => handleApprove(w.id)} disabled={actionLoading === w.id}>✅</button>
                          <button className="btn btn-sm btn-primary" onClick={() => handleReject(w.id)} disabled={actionLoading === w.id}>❌</button>
                        </div>
                      )}
                      {w.admin_note && <div className="text-xs text-gray" style={{ marginTop: '0.25rem' }}>{w.admin_note}</div>}
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

export default AdminWithdrawals;
