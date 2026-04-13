import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import StatusBadge from '../components/StatusBadge';

const Withdraw = () => {
  const { user, refreshUser } = useAuth();
  const [tab, setTab] = useState('withdraw'); // withdraw | history | banking
  const [form, setForm] = useState({ amount: '', bankName: '', accountHolder: '', accountNumber: '', branchCode: '' });
  const [banking, setBanking] = useState({ bankName: '', accountHolder: '', accountNumber: '', branchCode: '' });
  const [withdrawals, setWithdrawals] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Pre-fill banking details if available
    if (user?.bank_name) {
      const bd = { bankName: user.bank_name, accountHolder: user.account_holder, accountNumber: user.account_number, branchCode: user.branch_code };
      setForm((prev) => ({ ...prev, ...bd }));
      setBanking(bd);
    }
    api.get('/api/withdrawals').then((res) => setWithdrawals(res.data)).catch(console.error);
  }, [user]);

  const handleWithdraw = async (e) => {
    e.preventDefault();
    if (parseFloat(form.amount) < 100) {
      return toast.error('Minimum withdrawal is R100');
    }
    if (parseFloat(form.amount) > parseFloat(user?.balance || 0)) {
      return toast.error('Insufficient balance');
    }
    setLoading(true);
    try {
      await api.post('/api/withdrawals', form);
      toast.success('Withdrawal request submitted!');
      await refreshUser();
      const res = await api.get('/api/withdrawals');
      setWithdrawals(res.data);
      setForm((prev) => ({ ...prev, amount: '' }));
    } catch (err) {
      toast.error(err.response?.data?.error || 'Withdrawal failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveBanking = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.put('/api/withdrawals/banking', banking);
      toast.success('Banking details saved!');
      await refreshUser();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save banking details');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="section-title">Withdrawals</div>
      <p className="section-subtitle">Request a withdrawal or manage your banking details</p>

      {/* Balance card */}
      <div className="stat-card" style={{ marginBottom: '1.5rem', background: 'linear-gradient(135deg, var(--green), var(--green-dark))', color: 'white', border: 'none', maxWidth: 350 }}>
        <div className="stat-icon" style={{ background: 'rgba(255,255,255,0.2)' }}>💰</div>
        <div>
          <div className="stat-value" style={{ color: 'white' }}>R{parseFloat(user?.balance || 0).toFixed(2)}</div>
          <div className="stat-label" style={{ color: 'rgba(255,255,255,0.8)' }}>Available Balance</div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', borderBottom: '2px solid var(--gray-200)', paddingBottom: '0.5rem' }}>
        {['withdraw', 'history', 'banking'].map((t) => (
          <button
            key={t}
            className={`btn btn-sm ${tab === t ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setTab(t)}
            style={{ textTransform: 'capitalize' }}
          >
            {t === 'withdraw' ? '💸 Withdraw' : t === 'history' ? '📋 History' : '🏦 Banking Details'}
          </button>
        ))}
      </div>

      {/* Withdraw tab */}
      {tab === 'withdraw' && (
        <div style={{ maxWidth: 520 }}>
          <div className="card">
            <div className="card-title" style={{ marginBottom: '1.25rem' }}>Request Withdrawal</div>
            <div className="alert alert-info" style={{ marginBottom: '1.25rem' }}>
              💡 Minimum withdrawal: R100. Processing time: 1-2 business days.
            </div>
            <form onSubmit={handleWithdraw}>
              <div className="form-group">
                <label className="form-label">Amount (R)</label>
                <input
                  type="number"
                  className="form-control"
                  placeholder="Enter amount (min R100)"
                  min="100"
                  step="0.01"
                  value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: e.target.value })}
                  required
                />
                <p className="text-xs text-gray" style={{ marginTop: '0.25rem' }}>
                  Available: R{parseFloat(user?.balance || 0).toFixed(2)}
                </p>
              </div>

              <h4 style={{ marginBottom: '0.75rem', color: 'var(--gray-700)' }}>Banking Details</h4>
              <div className="form-group">
                <label className="form-label">Bank Name</label>
                <input type="text" className="form-control" placeholder="e.g. FNB, Standard Bank, ABSA" value={form.bankName} onChange={(e) => setForm({ ...form, bankName: e.target.value })} required />
              </div>
              <div className="form-group">
                <label className="form-label">Account Holder</label>
                <input type="text" className="form-control" placeholder="Full name on account" value={form.accountHolder} onChange={(e) => setForm({ ...form, accountHolder: e.target.value })} required />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Account Number</label>
                  <input type="text" className="form-control" placeholder="Account number" value={form.accountNumber} onChange={(e) => setForm({ ...form, accountNumber: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Branch Code</label>
                  <input type="text" className="form-control" placeholder="e.g. 250655" value={form.branchCode} onChange={(e) => setForm({ ...form, branchCode: e.target.value })} required />
                </div>
              </div>
              <button className="btn btn-green btn-block btn-lg" type="submit" disabled={loading}>
                {loading ? '⏳ Processing...' : '💸 Submit Withdrawal'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* History tab */}
      {tab === 'history' && (
        <div className="card">
          {withdrawals.length === 0 ? (
            <div className="empty-state">
              <div className="icon">💸</div>
              <p>No withdrawal requests yet</p>
            </div>
          ) : (
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Amount</th>
                    <th>Bank</th>
                    <th>Account</th>
                    <th>Status</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {withdrawals.map((w) => (
                    <tr key={w.id}>
                      <td className="font-semibold text-red">R{parseFloat(w.amount).toFixed(2)}</td>
                      <td>{w.bank_name}</td>
                      <td style={{ fontSize: '0.8rem' }}>{w.account_holder} · {w.account_number}</td>
                      <td><StatusBadge status={w.status} /></td>
                      <td style={{ fontSize: '0.8rem', color: 'var(--gray-600)' }}>{new Date(w.created_at).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Banking details tab */}
      {tab === 'banking' && (
        <div style={{ maxWidth: 480 }}>
          <div className="card">
            <div className="card-title" style={{ marginBottom: '1.25rem' }}>Save Banking Details</div>
            <p style={{ color: 'var(--gray-600)', fontSize: '0.875rem', marginBottom: '1.25rem' }}>
              Save your banking details for faster withdrawals.
            </p>
            <form onSubmit={handleSaveBanking}>
              <div className="form-group">
                <label className="form-label">Bank Name</label>
                <input type="text" className="form-control" placeholder="e.g. FNB, Standard Bank" value={banking.bankName} onChange={(e) => setBanking({ ...banking, bankName: e.target.value })} required />
              </div>
              <div className="form-group">
                <label className="form-label">Account Holder</label>
                <input type="text" className="form-control" placeholder="Full name on account" value={banking.accountHolder} onChange={(e) => setBanking({ ...banking, accountHolder: e.target.value })} required />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Account Number</label>
                  <input type="text" className="form-control" placeholder="Account number" value={banking.accountNumber} onChange={(e) => setBanking({ ...banking, accountNumber: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Branch Code</label>
                  <input type="text" className="form-control" placeholder="e.g. 250655" value={banking.branchCode} onChange={(e) => setBanking({ ...banking, branchCode: e.target.value })} required />
                </div>
              </div>
              <button className="btn btn-primary btn-block" type="submit" disabled={loading}>
                {loading ? 'Saving...' : '💾 Save Banking Details'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Withdraw;
