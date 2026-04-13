import React, { useEffect, useState } from 'react';
import api from '../utils/api';
import StatusBadge from '../components/StatusBadge';

const Transactions = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: 20 });
      if (filter) params.set('type', filter);
      const res = await api.get(`/api/transactions?${params}`);
      setTransactions(res.data.transactions);
      setTotal(res.data.total);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTransactions(); }, [page, filter]); // eslint-disable-line

  const totalPages = Math.ceil(total / 20);

  const typeIcon = (type) => {
    switch (type) {
      case 'investment': return '💼';
      case 'daily_profit': return '📈';
      case 'referral_bonus': return '🤝';
      case 'withdrawal': return '💸';
      default: return '💳';
    }
  };

  return (
    <div>
      <div className="section-title">Transactions</div>
      <p className="section-subtitle">Complete history of all your financial activity</p>

      {/* Filters */}
      <div className="card" style={{ marginBottom: '1rem' }}>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          {['', 'investment', 'daily_profit', 'referral_bonus', 'withdrawal'].map((type) => (
            <button
              key={type}
              className={`btn btn-sm ${filter === type ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => { setFilter(type); setPage(1); }}
            >
              {type === '' ? 'All' : type.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      <div className="card">
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}>
            <div className="spinner" />
          </div>
        ) : transactions.length === 0 ? (
          <div className="empty-state">
            <div className="icon">💳</div>
            <p>No transactions found</p>
          </div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Description</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((tx) => (
                  <tr key={tx.id}>
                    <td>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', textTransform: 'capitalize' }}>
                        {typeIcon(tx.type)} {tx.type.replace('_', ' ')}
                      </span>
                    </td>
                    <td style={{ maxWidth: 200, color: 'var(--gray-600)', fontSize: '0.8rem' }}>
                      {tx.description || '-'}
                    </td>
                    <td className={`font-semibold ${tx.type === 'withdrawal' ? 'text-red' : 'text-green'}`}>
                      {tx.type === 'withdrawal' ? '-' : '+'}R{parseFloat(tx.amount).toFixed(2)}
                    </td>
                    <td><StatusBadge status={tx.status} /></td>
                    <td style={{ fontSize: '0.8rem', color: 'var(--gray-600)' }}>
                      {new Date(tx.created_at).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {totalPages > 1 && (
          <div className="pagination" style={{ marginTop: '1rem' }}>
            <button className="page-btn" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>←</button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => i + 1).map((p) => (
              <button key={p} className={`page-btn ${page === p ? 'active' : ''}`} onClick={() => setPage(p)}>
                {p}
              </button>
            ))}
            <button className="page-btn" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>→</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Transactions;
