import React, { useEffect, useState } from 'react';
import api from '../../utils/api';
import StatusBadge from '../../components/StatusBadge';
import toast from 'react-hot-toast';

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/api/admin/users?page=${page}&limit=20`);
      setUsers(res.data.users);
      setTotal(res.data.total);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, [page]); // eslint-disable-line

  const handleToggle = async (id, name, isActive) => {
    if (!window.confirm(`${isActive ? 'Disable' : 'Enable'} account for ${name}?`)) return;
    try {
      await api.put(`/api/admin/users/${id}/toggle`);
      toast.success(`User ${isActive ? 'disabled' : 'enabled'}`);
      fetchUsers();
    } catch (err) {
      toast.error('Failed to toggle user');
    }
  };

  const totalPages = Math.ceil(total / 20);

  return (
    <div>
      <div className="section-title">Manage Users</div>
      <p className="section-subtitle">View and manage all platform users</p>

      <div className="card">
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}>
            <div className="spinner" />
          </div>
        ) : users.length === 0 ? (
          <div className="empty-state">
            <div className="icon">👥</div>
            <p>No users found</p>
          </div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>User</th>
                  <th>Referral Code</th>
                  <th>Balance</th>
                  <th>Total Earned</th>
                  <th>Investments</th>
                  <th>Active</th>
                  <th>Status</th>
                  <th>Joined</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id}>
                    <td>
                      <div className="font-semibold">{u.name}</div>
                      <div className="text-xs text-gray">{u.email}</div>
                    </td>
                    <td><code style={{ fontSize: '0.8rem', background: 'var(--gray-100)', padding: '0.2rem 0.4rem', borderRadius: 4 }}>{u.referral_code}</code></td>
                    <td className="font-semibold text-green">R{parseFloat(u.balance).toFixed(2)}</td>
                    <td>R{parseFloat(u.total_earned).toFixed(2)}</td>
                    <td style={{ textAlign: 'center' }}>{u.total_investments || 0}</td>
                    <td style={{ textAlign: 'center' }}>{u.active_investments || 0}</td>
                    <td>
                      <StatusBadge status={u.is_active ? 'active' : 'rejected'} />
                    </td>
                    <td className="text-sm text-gray">{new Date(u.created_at).toLocaleDateString()}</td>
                    <td>
                      {u.role !== 'admin' && (
                        <button
                          className={`btn btn-sm ${u.is_active ? 'btn-primary' : 'btn-green'}`}
                          onClick={() => handleToggle(u.id, u.name, u.is_active)}
                        >
                          {u.is_active ? '🚫 Disable' : '✅ Enable'}
                        </button>
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

export default AdminUsers;
